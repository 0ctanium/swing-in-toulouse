# Database network transfer investigation

**Project:** Swing in Toulouse  
**Database:** Neon PostgreSQL 17 (AWS `eu-central-1`)  
**Report date:** 4 June 2026  
**Scope:** Code review of how the app uses PostgreSQL and what likely drives Neon **public network transfer** (egress).

---

## Executive summary

Neon shows **~0.67 GB** of network transfer since 1 June 2026 against a **5 GB/month** free allowance, with only **~0.03 GB** of stored data. The ratio (~22× egress vs stored size) is high for a small calendar app, but it is **not yet near the billing limit**.

The main drivers are **architectural**, not a single bug:

1. **Most read paths load every master event** (with full relations and `ical_data`) before filtering in application code.
2. **Hourly iCal sync** runs many round-trips per event (N+1 queries, full-row reads/writes).
3. **Connection setup** uses a direct `pg` pool without Neon’s pooler or serverless driver—amplified on Vercel serverless and by **two branches** (`main` + `dev`) both receiving traffic.
4. **Heavy admin and archive queries** repeat full-table patterns.

None of this is catastrophic at current scale, but it explains why transfer grows faster than storage. The recommendations below are ordered by impact and effort.

---

## Context: what Neon measures

Per [Neon’s network transfer documentation](https://neon.com/docs/introduction/network-transfer):

- **Public network transfer** = data sent **from** your database **to clients** through the Neon proxy (egress). All PostgreSQL connections (direct and pooled) go through the proxy.
- Neon does **not** expose per-query transfer breakdowns in the console; you correlate spikes with schedules, deploys, and branch usage.
- On the **Free** plan, **5 GB/month** is included; exceeding it can suspend compute until the next cycle.
- **Logical replication**, `pg_dump` to your laptop, Drizzle Studio, migrations, and production traffic all count as egress when data leaves Neon over the public internet.

Your dashboard also shows **two branches** (`main`, `dev`) on the same project. Transfer is **project-level**; dev tooling and local `DATABASE_URL` pointed at the `dev` branch add to the same meter as production.

---

## Observed usage (from Neon console)

| Metric | Value | Notes |
|--------|-------|--------|
| Storage | 0.03 / 0.5 GB | ~30 MB — very small dataset |
| Network transfer | 0.67 / 5 GB | ~13% of monthly free quota in ~4 days |
| Branches | 2 / 10 | `main` + `dev` |
| Compute | 6.17 / 100 CU-hrs | Frequent short idle/active cycles (0.25 CU) |
| Default compute | 0.25 CU | Scale-to-zero when idle |

The monitoring chart (RAM + compute) shows **many short wake-ups**, which fits serverless requests, sync jobs, and dev connections—not one long-running worker.

---

## Methodology

This report is based on:

- Static analysis of the repository (`src/db`, Drizzle queries, sync, public API, admin, caching).
- Neon product docs for transfer semantics.
- The project screenshot you provided (usage since 1 Jun 2026).

No live query logging or Neon Consumption API calls were made from this environment. Quantitative estimates below are **order-of-magnitude** models, not measured per-query bytes.

---

## Architecture snapshot

| Layer | Implementation |
|-------|----------------|
| ORM | Drizzle + `node-postgres` (`pg` `Pool`) |
| Connection | `DATABASE_URL` — no `-pooler` host documented in repo |
| Pool size | `max: 10` (production), `5` (development), singleton in dev via `globalForDb` |
| Hosting | Next.js 16 App Router on Vercel (inferred from stack) |
| Cache | `"use cache"` + `cacheLife` (public pages: **300 s**, sitemap: **3600 s**) |
| Sync | QStash cron **`0 * * * *`** → `/api/cron/sync` |
| Local DB | Docker Compose Postgres (recommended in README) |

```12:17:src/db/index.ts
const pool =
  globalForDb.pool ??
  new Pool({
    connectionString: env.DATABASE_URL,
    max: env.NODE_ENV === "production" ? 10 : 5,
  });
```

---

## Findings

### 1. “Load all events, filter in app” (high impact on reads)

The dominant public read path is `getUpcomingEventsUncached` → `fetchMasterEvents` → `expandEventsWithOverrides`.

When no `organizationSlug` / `venueSlug` is passed, **`fetchMasterEvents` loads every non-duplicate master event** with nested `source`, `organization`, and `venue`:

```82:90:src/lib/events/queries.ts
  return db.query.events.findMany({
    where: filters.length > 0 ? and(...filters) : undefined,
    with: {
      source: true,
      organization: true,
      venue: true,
    },
    orderBy: (eventsTable, { asc }) => [asc(eventsTable.startAt)],
  }) as Promise<EventMaster[]>;
```

The `from` / `to` window only applies **after** expansion via `filterOccurrences`. The database does not narrow rows by date.

**Who triggers this repeatedly:**

| Consumer | Window | Cached? |
|----------|--------|---------|
| `/api/events` (agenda calendar, planning) | Per month / 6 months (client ranges) | Server cache keyed by range (5 min) |
| Home page | Default expansion | 5 min |
| Organizer / venue pages | **13 months** (`EXPANSION_MONTHS = 12` + 1 month back) | 5 min |
| Agenda filter options | **13 months** | 5 min |
| Sitemap archive months | **36 months** lookback | 1 h (but still runs heavy uncached work inside) |
| Admin dashboard stats | Full upcoming expansion | Uncached (uses `cookies()`) |

**Effect on transfer:** Every cache miss pulls the full event corpus plus joins. Payload includes `description`, `recurrence_rule`, and **`ical_data` JSONB** for every row.

---

### 2. Large row payloads: `ical_data` and relations (high impact)

`events.ical_data` stores rich iCal metadata (organizer, attendees, alarms, recurrence overrides, geo, etc.) via `buildIcalData` in `src/lib/ical/extract.ts`. That is useful for export and detail views but is **included in every `findMany` on events** because Drizzle relational queries select full rows.

The public API then serializes occurrences with **spread of the full occurrence**, including `icalData`, `source`, `organization`, and `venue`:

```13:20:src/lib/events/serialize.ts
export function serializeOccurrence(
  event: EventOccurrence,
): SerializableEventOccurrence {
  return {
    ...event,
    startAt: event.startAt.toISOString(),
    endAt: event.endAt?.toISOString() ?? null,
  };
}
```

So one agenda API response can ship **much more JSON than the UI needs** (chips, titles, dates). Neon egress is DB → Node; this still increases bytes read from Postgres per query.

---

### 3. Hourly iCal sync: N+1 queries and full scans (medium–high impact)

`syncSource` runs hourly for each active URL source. Per parsed event, `upsertEvent` typically does:

- Up to **2×** `findFirst` on `events` (by `source_uid`, then by `uid`)
- **`findOrCreateVenue`** → `findFirst` on `venues` (+ possible `update`/`insert`)
- **`resolveVenueForSync`** → more venue resolution queries
- **`update` or `insert`** with full row including `ical_data`
- Even “unchanged” events get an **`update` setting `synced_at`**

After processing the feed, **`cancelMissingEvents`** loads **all published events with `source_uid`** for that source and loops updates.

For *S* sources, *E* events per source, and *H* hours per month: order of **O(S × E × H)** round-trips, not one bulk upsert. With 4 seed sources and hundreds of events each, sync alone can account for **tens of thousands of queries per month**, each returning row data.

Sync also **invalidates all public cache tags** (`invalidateAllPublicCache`), so the next site traffic re-runs the heavy read paths in §1.

---

### 4. Full-table scans on `event_overrides` (medium impact)

Several hot paths load **all override rows** and filter in memory:

```59:64:src/lib/venues/effective-venue.ts
  const [rows, canonicalMap] = await Promise.all([
    db.query.eventOverrides.findMany({
      columns: { eventId: true, patch: true },
    }),
    loadVenueCanonicalMap(),
  ]);
```

The same pattern exists in `getEventIdsOverriddenToOrganization` (`src/lib/organizations/effective-organization.ts`). These run as part of **venue-scoped** and **organization-scoped** fetches—so they multiply with page/API traffic.

---

### 5. Admin UI loads entire event set in memory (medium impact)

`getAdminEventsFilterOptions` and the admin events table call `loadMasterEvents()`:

```232:241:src/lib/events/admin-events-table.ts
async function loadMasterEvents() {
  return db.query.events.findMany({
    where: isNull(events.canonicalEventId),
    with: {
      source: true,
      organization: true,
      venue: true,
      overrides: true,
    },
  });
}
```

There is **no SQL-level pagination**; filtering and sorting happen in Node after merge. Each admin visit can transfer the full dataset multiple times (`listVenuesWithStats` also loads all venues and recomputes counts from all events).

---

### 6. Direct `pg` pool without Neon pooler (medium impact on serverless)

The app uses a standard `pg` `Pool` against `DATABASE_URL`. On Vercel:

- Each warm function may hold pool connections.
- Cold starts open **new TLS sessions** to Neon (wake compute + protocol overhead).
- Without the **`-pooler`** endpoint, connection churn is higher than with Neon’s connection pooler.

This does not always dominate versus large `SELECT` results, but it matches the **frequent short compute spikes** in your graph.

---

### 7. Dual branch usage (`main` + `dev`) (medium impact, operational)

The Neon project has **`main` and `dev`**. Common setups:

- Production `DATABASE_URL` → `main`
- Local development or preview → `dev`

If local `pnpm dev`, `db:studio`, `db:push`, or tests hit Neon `dev` while production serves `main`, **both** contribute egress to the **same project quota**. README correctly points local Docker Postgres at `localhost:5432`; any deviation routes dev traffic to Neon.

---

### 8. Caching helps but is relatively short for hot paths (low–medium impact)

Public event data uses **`PUBLIC_PAGE_REVALIDATE = 300`** (5 minutes). That is good for freshness after sync, but:

- Crawlers, calendar clients, and agenda month changes still miss cache often.
- Each miss repeats §1–§2.
- Hourly sync **busts** event-related tags globally.

Sitemap uses 1 hour; archive month computation inside sitemap still invokes **`listEventArchiveMonthsUncached`** (36-month expansion over all masters).

---

### 9. Agenda client: many distinct cache keys (low–medium impact)

The calendar calls `/api/events?from=&to=` with **month-specific** bounds (`agenda-calendar.tsx`). Each range is a separate Next cache key. Users browsing months generate **multiple full-backend loads** (mitigated only by React Query client cache for identical ranges in one session).

---

## Rough transfer model (illustrative)

Assume:

- ~400 master events, ~3 KB average row with relations + `ical_data`
- Full load ≈ **1.2 MB** per `fetchMasterEvents`
- 50 cache misses/day across prod + dev + crawlers ≈ **60 MB/day**
- Hourly sync: ~400 events × 4 sources × ~3 KB × 24 ≈ **115 MB/day** (reads + writes; simplified)
- Admin + studio + migrations: variable **10–50 MB/day**

→ **~200 MB/day** is plausible → **~0.6 GB in 3–4 days**, aligned with **0.67 GB** observed.

Exact numbers depend on real event counts and traffic; the model shows why transfer **outpaces** storage.

---

## Recommendations

### Quick wins (low effort, high value)

1. **Use local Postgres for development**  
   Keep `DATABASE_URL` on `postgresql://swing:swing@localhost:5432/...` (see README). Reserve Neon `dev` for integration tests only, or delete the branch if unused.

2. **Switch production to Neon’s pooled connection string**  
   In Vercel, set `DATABASE_URL` to the host with **`-pooler`** (Neon console → Connection details). Reduces connection churn on serverless. Optionally add `?sslmode=require` per Neon docs.

3. **Exclude `ical_data` from list/read queries**  
   Add Drizzle `columns` on `events` for agenda, hub, filters, and API list paths; load `ical_data` only on event detail and iCal export. Cuts egress per row often by **30–60%**.

4. **Push date filters into SQL**  
   For `getUpcomingEventsUncached`, add `WHERE start_at <= :to AND (end_at >= :from OR recurrence_rule IS NOT NULL)` (tune for recurrence). Stop loading cancelled/duplicate rows early.

5. **Fix override lookups**  
   Replace full `eventOverrides.findMany()` with targeted queries, e.g. `WHERE patch->>'venueId' = :id` or a materialized mapping table / partial index on JSON paths you filter on.

6. **Trim API JSON**  
   Introduce a slim DTO in `serializeOccurrence` for `/api/events` (id, title, start, end, slug, venue label, categories—no `icalData`, minimal `source`).

### Medium effort

7. **Batch iCal sync**  
   - Single `findMany` per source for existing events keyed by `source_uid`  
   - Bulk upsert (`INSERT ... ON CONFLICT`) in a transaction  
   - Skip `UPDATE synced_at` when nothing changed (or batch touch)  
   - Load active UIDs with one query in `cancelMissingEvents`

8. **Extend public cache TTL**  
   e.g. 15–30 minutes for event lists; keep shorter TTL or tag invalidation only on sync/admin writes. Reduces repeat full loads.

9. **Admin pagination in SQL**  
   `LIMIT/OFFSET` or keyset pagination on `loadMasterEvents`; separate lightweight query for filter dropdowns.

10. **Archive months without 36-month expansion**  
    Use SQL `date_trunc('month', start_at)` aggregation instead of expanding all recurrences for three years.

### Longer term

11. **`@neondatabase/serverless` or HTTP driver** for edge/serverless routes if you split workloads.

12. **Read replica** only if read volume justifies it (unlikely on Free tier at current scale).

13. **Neon Consumption API** in a small script or dashboard to track `public_network_transfer_bytes` weekly and alert before 5 GB.

---

## Monitoring checklist

- [ ] Confirm Vercel production uses **pooled** `DATABASE_URL` for `main`.
- [ ] Confirm local `.env.local` uses **Docker Postgres**, not Neon `dev`, for day-to-day dev.
- [ ] Note whether Drizzle Studio / `db:push` run against Neon (spikes on deploy days).
- [ ] Compare transfer before/after sync hour (QStash `0 * * * *`).
- [ ] If available, split usage by branch in Neon branch detail API.
- [ ] After code changes, re-check transfer after 48 h (Neon aggregates with delay).

---

## What is *not* the problem

- **Storage size** (0.03 GB) is healthy; no blob-in-Postgres issue (iCal files use Vercel Blob).
- **No client polling loop** was found (`refetchInterval` not used).
- **Caching exists** and is appropriate for a calendar; it is just short relative to query weight.
- **0.67 GB / 5 GB** is not an emergency, but the **egress-to-data ratio** signals inefficiency that will scale poorly if traffic or sources grow.

---

## Suggested implementation order

| Priority | Item | Expected transfer reduction |
|----------|------|-----------------------------|
| P0 | Local dev off Neon `dev` | 20–40% if dev was on Neon |
| P0 | Pooled connection URL on Vercel | 5–15% (connection overhead) |
| P1 | SQL date filter + slimmer columns on event lists | 30–50% on read paths |
| P1 | Targeted override queries | 5–10% |
| P2 | Sync batching + fewer touch updates | 10–25% on sync hours |
| P2 | Slim `/api/events` payload | 10–20% on API-heavy traffic |
| P3 | Longer cache / archive SQL | 10–30% depending on traffic |

---

## Implementer catalog

For a **per-function list** (query shape, call chain, test steps, severity IDs Q-001…), see **[`db-query-optimization-catalog.md`](./db-query-optimization-catalog.md)**.

---

## References

- [Neon — Reduce network transfer costs](https://neon.com/docs/introduction/network-transfer)
- [Neon — Cost optimization](https://neon.com/docs/introduction/cost-optimization)
- [Neon — Consumption metrics API](https://neon.com/docs/guides/consumption-metrics)
- Application: `src/db/index.ts`, `src/lib/events/queries.ts`, `src/lib/ical/sync.ts`, `src/app/api/events/route.ts`

---

*Generated from repository analysis. Re-run investigation after major schema or traffic changes.*
