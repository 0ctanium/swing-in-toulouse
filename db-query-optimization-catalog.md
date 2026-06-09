# Database query optimization catalog

Handoff document for **human implementers**. Each entry names the function, the exact Drizzle call, why it is costly, suggested direction, and how to verify a fix.

Related: high-level context in [`db-optimization-report.md`](./db-optimization-report.md).

---

## How to test any fix

### 1. Baseline query count (local Postgres)

```bash
pnpm run docker:up
# Enable log_statement in postgres or use:
docker compose exec postgres psql -U swing -d swing_in_toulouse -c "LOAD 'auto_explain';"
```

Or wrap the function under test in a script:

```ts
// scripts/bench-query.ts (create temporarily)
import "@/load-env";
import { closeDb } from "@/db";
import { getUpcomingEventsUncached } from "@/lib/events/queries";

async function main() {
  const t0 = performance.now();
  const rows = await getUpcomingEventsUncached({
    from: new Date("2026-06-01"),
    to: new Date("2026-06-30"),
  });
  console.log({ count: rows.length, ms: performance.now() - t0 });
  await closeDb();
}
main();
```

Run: `tsx scripts/bench-query.ts`

### 2. `EXPLAIN (ANALYZE, BUFFERS)` on the SQL

Use Drizzle’s logged SQL or copy from Postgres logs:

```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT ... -- your optimized query
```

Check: sequential scans on `events`, width of returned columns, nested loop count.

### 3. Row / byte estimate

```sql
SELECT
  COUNT(*) AS masters,
  pg_size_pretty(SUM(pg_column_size(e.*))) AS approx_row_bytes
FROM events e
WHERE canonical_event_id IS NULL AND status = 'published';
```

Compare before/after dropping `ical_data` from SELECT lists.

### 4. Production / Neon (read-only)

- Neon console → Monitoring → correlate spikes with QStash sync hour (`0 * * * *`).
- After deploy, compare **public network transfer** over 48h (no per-query breakdown in UI).

### 5. Regression tests (app-level)

| Area | Test |
|------|------|
| Public agenda | `GET /api/events?from=…&to=…` — same JSON shape, fewer DB round-trips (mock `db` or integration test) |
| Organizer page | `/organisateur/[slug]` — event list unchanged |
| Venue page | `/lieu/[slug]` |
| iCal export | `/api/ical/e30=.ics` — valid calendar, same event count |
| Sync | `pnpm run sync` — stats unchanged; fewer queries (log count) |
| Admin events table | `/admin/events` — pagination totals match |

---

## Issue type legend

| Tag | Meaning |
|-----|---------|
| **FULL-EVENTS** | Loads all (or most) master `events` rows with full relations, no date filter in SQL |
| **FULL-OVERRIDES** | `event_overrides` full table (or unfiltered) scan |
| **FULL-VENUES** | All `venues` rows when a map/slice would suffice |
| **N+1** | One query per item in a loop |
| **FAT-ROW** | Selects `ical_data`, `description`, etc. when not needed |
| **APP-FILTER** | SQL returns superset; date/venue filtered in Node after expansion |
| **REDUNDANT** | Same entity fetched twice in one request |
| **NO-PAGINATION** | Admin/list loads entire table then slices in memory |
| **SYNC-CHURN** | Hourly sync: many round-trips / unconditional writes |

---

## Severity guide

| Level | Action |
|-------|--------|
| **P0** | Hot path (public agenda, hourly sync) — fix first |
| **P1** | Frequent admin / venue / export paths |
| **P2** | Rare or already column-limited — fix when touching file |

---

# P0 — Public read hot path

## Q-001 · `fetchMasterEvents` (unscoped branch)

| Field | Value |
|-------|--------|
| **File** | `src/lib/events/queries.ts` |
| **Lines** | 41–91 (critical: **82–90**) |
| **Visibility** | `async function` (not exported) |
| **Tags** | FULL-EVENTS, FAT-ROW, APP-FILTER |

### Query (when no `organizationSlug` / `venueSlug`)

```ts
db.query.events.findMany({
  where: and(
    eq(events.status, "published"),
    isNull(events.canonicalEventId),
  ),
  with: { source: true, organization: true, venue: true },
  orderBy: asc(events.startAt),
});
```

Equivalent to: all published masters + 3 joins; **all columns** on `events` including `ical_data` (jsonb) and `description`.

### Call chain

```
getUpcomingEventsUncached (231)
  → fetchMasterEvents (251)          // no slug → Q-001
  → expandEventsWithOverrides (257)
  → filterOccurrences (276)            // date filter ONLY here

getEventsForExportUncached (355)
  → fetchMasterEvents (357)

listUpcomingEventsForHubUncached (536)
  → getUpcomingEventsUncached

listEventArchiveMonthsUncached (575)
  → getUpcomingEventsUncached({ from: 36mo ago, to })  // worst window

getRelatedEventsUncached (602)       // org/venue branches use scoped fetch
```

Also via cache: `getUpcomingEvents`, `getEventsForExport`, home page (`home-page-events-section.tsx`), `/api/events`.

### Problem

- DB returns **every** master event regardless of `from`/`to` passed to `getUpcomingEventsUncached`.
- Recurring events expanded in Node for the whole window, then discarded by `filterOccurrences`.

### Suggested fix

1. Add SQL predicates: non-recurring `start_at` / `end_at` overlap with window; recurring `recurrence_rule IS NOT NULL` (or materialized occurrence table later).
2. Use `columns: { … }` on `events` — omit `icalData`, `description` for list paths (load on detail/export only).
3. Consider DB view `event_masters_list` with slim columns.

### Test

- `getUpcomingEventsUncached({ from: June 1, to: June 30 })` → `EXPLAIN` should show `Index Scan` on `events_start_at_idx` + fewer rows than `COUNT(*)`.
- Compare agenda month view before/after: same events on calendar UI.
- Archive page: month links still correct (`listEventArchiveMonthsUncached`).

---

## Q-002 · `getUpcomingEventsUncached`

| Field | Value |
|-------|--------|
| **File** | `src/lib/events/queries.ts` |
| **Lines** | 231–277 |
| **Exported** | Yes |
| **Tags** | APP-FILTER, REDUNDANT |

### Behavior

1. Builds `window` from `options.from` / `options.to`.
2. Calls **Q-001** or scoped fetch via org/venue slug.
3. `expandEventsWithOverrides(masters, window)` — see Q-020.
4. If `organizationSlug`: **second** `organizations.findFirst` (260–262) after slug lookup inside `fetchMasterEvents` (55–57).
5. If `venueSlug`: `filterOccurrencesForVenue` → **Q-010** (`loadVenueCanonicalMap`).

### Problem

Orchestrates multiple expensive steps; org slug path queries organization **twice**.

### Suggested fix

- Fix Q-001; pass `organization.id` from first lookup into filter step (remove 260–262).
- For venue slug path, pass `venueId` into expansion filter without re-fetching org.

### Test

- `GET /api/events?from=&to=` (agenda calendar month bounds).
- `pnpm run dev` → open `/agenda`, change month — React Query should return same events.
- Admin cookie session: optional `admin` meta on API still works (`src/app/api/events/route.ts`).

---

## Q-003 · `expandEventsWithOverrides`

| Field | Value |
|-------|--------|
| **File** | `src/lib/events/expand-with-overrides.ts` |
| **Lines** | 90–128 |
| **Exported** | Yes |
| **Tags** | FAT-ROW (inherits master shape) |

### Queries

1. `loadOverridesForEvents(eventIds)` — **Q-019** (scoped by IDs ✓).
2. `loadRelationMaps` — `organizations.findMany` / `venues.findMany` by ID set (✓ efficient).
3. CPU: `expandMasterEventsToOccurrences` (node-ical) per master with `recurrence_rule`.

### Call chain

Nearly every public event list; admin scheduling (`buildNextOccurrenceMap`).

### Problem

Not a SQL bug by itself, but **amplifies Q-001**: expanding hundreds of masters for a one-month API window is expensive and keeps fat rows in memory.

### Suggested fix

- Narrow masters in SQL first (Q-001).
- For month API, skip expansion for non-recurring events outside window (fast path).

### Test

- Recurring weekly class: still appears each week in month view.
- Single non-recurring event outside month: absent.

---

## Q-004 · `listEventArchiveMonthsUncached`

| Field | Value |
|-------|--------|
| **File** | `src/lib/events/queries.ts` |
| **Lines** | 575–587 |
| **Exported** | Yes |
| **Tags** | FULL-EVENTS, APP-FILTER |

### Query chain

`getUpcomingEventsUncached({ from: getArchiveLookbackStart(), to: getLastCompleteArchiveMonthEnd() })`  
→ **36 months** (`EVENT_ARCHIVE_LOOKBACK_MONTHS` in `src/lib/events/hub.ts`) → Q-001 + full expansion.

### Call chain

```
sitemap() (src/app/sitemap.ts:38)     // NOT inside "use cache" — runs every sitemap generation
listEventArchiveMonths (cached export)
```

### Problem

Heaviest read path: three years of occurrences derived from all masters.

### Suggested fix

```sql
SELECT DISTINCT date_trunc('month', start_at AT TIME ZONE 'Europe/Paris') ...
FROM events WHERE ...
```

Or maintain `archive_months` materialized view updated on sync.

### Test

- `/sitemap.xml` contains `/evenements/YYYY/MM` URLs.
- `/evenements` archive sidebar matches previous months.

---

## Q-005 · `getAgendaFilterOptionsUncached`

| Field | Value |
|-------|--------|
| **File** | `src/lib/events/agenda-filter-options.ts` |
| **Lines** | 36–98 |
| **Exported** | Yes |
| **Tags** | FULL-EVENTS (via `getUpcomingEvents`), FULL-VENUES |

### Queries

1. `getUpcomingEvents({ from, to })` with `getDefaultExpansionWindow()` → **~13 months**, Q-001.
2. `loadVenueCanonicalMap()` → Q-011.
3. `db.query.venues.findMany({ columns: { id, slug, name } })` — all venues.

### Call chain

`GET /api/events/filters` → `getAgendaFilterOptions` (cached 5 min).

### Problem

Builds filter dropdowns by scanning all occurrences in a year+ window.

### Suggested fix

- SQL `DISTINCT` on categories (unnest `categories` array) for events in next N months.
- Distinct venue/org IDs from SQL, not full expansion.

### Test

- Agenda filter UI: venue/org/category options complete.
- Selecting a filter still narrows calendar correctly.

---

# P0 — iCal sync (hourly)

## Q-006 · `upsertEvent`

| Field | Value |
|-------|--------|
| **File** | `src/lib/ical/sync.ts` |
| **Lines** | 64–167 |
| **Visibility** | `async function` (private) |
| **Tags** | N+1, FAT-ROW, SYNC-CHURN |

### Queries per parsed iCal event (typical)

| Step | Query |
|------|--------|
| 1 | `events.findFirst` by `(source_id, source_uid)` |
| 2 | `events.findFirst` by `uid` (if missing) |
| 3 | `venues.findFirst` by slug — `findOrCreateVenue` |
| 3b | optional `venues.update` |
| 4 | `loadVenueCanonicalMap` + `venues.findFirst` — `resolveVenueForSync` (Q-012) |
| 5 | `events.findFirst` by slug — `resolveUniqueSlug` (insert only) |
| 6 | `events.update` (full row incl. `ical_data`) **or** `insert` |
| Unchanged | Still `update` setting `synced_at` only (139–142) — **write churn** |

### Call chain

```
syncSource (230)
  → for each parsed event: upsertEvent (244)
POST /api/cron/sync (hourly QStash)
pnpm run sync
```

### Problem

For *E* events × *S* sources × 24/day: thousands of round-trips. Unchanged rows still write `synced_at`.

### Suggested fix

1. Preload `Map<source_uid, EventRow>` for source in one `findMany`.
2. Batch venues: preload slugs seen in feed.
3. Skip `update` entirely when `!hasChanges` (no `synced_at` touch) or batch `synced_at` once per source.
4. `INSERT … ON CONFLICT (source_id, source_uid) DO UPDATE`.

### Test

```bash
pnpm run sync
# Compare sync_logs events_updated / unchanged
# pg_stat_statements: calls to events should drop from O(E) toward O(1-3) per source
```

---

## Q-007 · `cancelMissingEvents`

| Field | Value |
|-------|--------|
| **File** | `src/lib/ical/sync.ts` |
| **Lines** | 169–207 |
| **Tags** | FAT-ROW, N+1 |

### Query

```ts
db.query.events.findMany({
  where: and(
    eq(events.sourceId, sourceId),
    isNotNull(events.sourceUid),
    eq(events.status, "published"),
  ),
}); // full rows
```

Then per missing event: `update` in loop.

### Problem

Loads all active events for source; per-row updates.

### Suggested fix

```sql
UPDATE events SET status = 'cancelled', ...
WHERE source_id = $1 AND source_uid IS NOT NULL
  AND status = 'published'
  AND source_uid NOT IN (...)
```

### Test

- Remove event from external iCal → after sync, event `cancelled` in DB.
- `events_cancelled` in `sync_logs` correct.

---

## Q-008 · `syncSource` / `syncAllSources`

| Field | Value |
|-------|--------|
| **File** | `src/lib/ical/sync.ts` |
| **Lines** | 230–274, 303–323 |
| **Tags** | SYNC-CHURN |

### Queries

- `syncAllSources`: `sources.findMany` (active iCal) — OK.
- Per source: entire Q-006 + Q-007 chain.
- `sync_logs.insert` each run.

### Side effect

`invalidateAllPublicCache()` in `src/app/api/cron/sync/route.ts` → forces Q-001 on next traffic.

### Test

- Hourly cron JSON response lists all sources.
- After sync, public agenda shows new events within 5 min cache TTL (or immediately if cache invalidated).

---

## Q-009 · `findOrCreateVenue`

| Field | Value |
|-------|--------|
| **File** | `src/lib/venues/find-or-create.ts` |
| **Lines** | 8–40 |
| **Exported** | Yes |
| **Tags** | N+1 |

### Query

`venues.findFirst({ where: eq(venues.slug, slug) })` per distinct location in sync.

### Call chain

`upsertEvent` → every event with location.

### Suggested fix

In-memory map during `syncSource`; bulk insert new venues.

### Test

- New location string in iCal → venue row created once.
- Re-sync unchanged → no duplicate venues.

---

## Q-012 · `resolveVenueForSync`

| Field | Value |
|-------|--------|
| **File** | `src/lib/venues/canonical.ts` |
| **Lines** | 70–82 |
| **Tags** | N+1, FULL-VENUES |

### Queries per call

1. `resolveRootCanonicalVenueId` → `loadVenueCanonicalMap()` (**all venues**, Q-011).
2. Optional `venues.findFirst` by canonical id.

### Call chain

`upsertEvent` for every event with location — **loads full venue map per event**.

### Suggested fix

Call `loadVenueCanonicalMap()` **once per `syncSource`** and pass map into `findOrCreateVenue` / `resolveVenueForSync`.

### Test

- Sync with alias venue IDs → events attach to canonical venue.

---

# P1 — Scoped fetches & override scans

## Q-010 · `getEventIdsOverriddenToVenue`

| Field | Value |
|-------|--------|
| **File** | `src/lib/venues/effective-venue.ts` |
| **Lines** | 59–80 |
| **Tags** | FULL-OVERRIDES |

### Query

```ts
db.query.eventOverrides.findMany({
  columns: { eventId: true, patch: true },
}); // NO WHERE — entire table
```

Filters in JS: `patch.venueId` canonical-matches `venueId`.

### Call chain

`fetchMastersForVenue` (93) → every `/lieu/[slug]` page load (via Q-014).

### Suggested fix

- `WHERE occurrence_start_at IS NULL AND patch->>'venueId' IS NOT NULL`
- Or generated column `patch_venue_id` + index.

### Test

- Venue page lists events whose **override** points to this venue.
- Event with override to venue B not listed on venue A.

---

## Q-011 · `loadVenueCanonicalMap`

| Field | Value |
|-------|--------|
| **File** | `src/lib/venues/canonical.ts` |
| **Lines** | 50–56 |
| **Exported** | Yes |
| **Tags** | FULL-VENUES |

### Query

```ts
db.query.venues.findMany({
  columns: { id: true, canonicalVenueId: true },
});
```

### Call chain (frequent)

`getAgendaFilterOptionsUncached`, `filterOccurrencesForVenue`, `fetchMastersForVenue` (via Q-010), `listVenuesWithStats`, iCal `buildVenueSlugById`, venue matching tools, `resolveRootCanonicalVenueId`.

### Problem

Small table today, but called **many times per request** (not cached in-process).

### Suggested fix

- React `cache()` / request-scoped memo for `loadVenueCanonicalMap`.
- Or include canonical id in venue join on events query.

### Test

- Venue alias redirect `/lieu/alias-slug` → 308 to canonical.
- Filter occurrences on venue page still correct.

---

## Q-013 · `getEventIdsOverriddenToOrganization`

| Field | Value |
|-------|--------|
| **File** | `src/lib/organizations/effective-organization.ts` |
| **Lines** | 19–34 |
| **Tags** | FULL-OVERRIDES |

Same pattern as Q-010 but filters `patch.organizationId === organizationId` in memory.

### Call chain

`fetchMastersForOrganization` (41) → `/organisateur/[slug]`.

### Suggested fix

SQL filter on `patch->>'organizationId' = $1`.

### Test

Organizer page shows events overridden to this org.

---

## Q-014 · `fetchMastersForVenue`

| Field | Value |
|-------|--------|
| **File** | `src/lib/venues/effective-venue.ts` |
| **Lines** | 82–122 |
| **Tags** | FAT-ROW, FULL-OVERRIDES (via Q-010) |

### Queries

1. `venues.findMany` aliases (`canonical_venue_id = venueId`) — OK.
2. `getEventIdsOverriddenToVenue(venueId)` — Q-010.
3. `events.findMany` with `venue_id IN (…)` OR `id IN (override ids)` + full `with: { source, organization, venue }`.

### Problem

Better than Q-001 (scoped), but still full event rows + full override scan.

### Suggested fix

- Fix Q-010.
- Slim columns on events; SQL date window for non-recurring.

### Test

`/lieu/[slug]` event list matches current production.

---

## Q-015 · `fetchMastersForOrganization`

| Field | Value |
|-------|--------|
| **File** | `src/lib/organizations/effective-organization.ts` |
| **Lines** | 36–69 |
| **Tags** | FAT-ROW, FULL-OVERRIDES (via Q-013) |

Same structure as Q-014 for `organization_id`.

### Test

`/organisateur/[slug]` event list unchanged.

---

## Q-016 · `getOrganizerBySlugUncached`

| Field | Value |
|-------|--------|
| **File** | `src/lib/events/queries.ts` |
| **Lines** | 295–319 |
| **Tags** | APP-FILTER |

### Queries

1. `organizations.findFirst` by slug.
2. `loadOrganizationDisplayVenue` — venue by id.
3. `fetchMastersForOrganization` — Q-015.
4. `expandEventsWithOverrides` with **`getDefaultExpansionWindow()`** (~13 months).

### Test

Organizer page, OG image route `organisateur/[slug]/opengraph-image.tsx`.

---

## Q-017 · `getVenueBySlugUncached`

| Field | Value |
|-------|--------|
| **File** | `src/lib/events/queries.ts` |
| **Lines** | 321–348 |
| **Tags** | APP-FILTER, REDUNDANT |

### Queries

1. `resolveVenueBySlug` (2× `venues.findFirst` if alias).
2. `fetchMastersForVenue` — Q-014.
3. `expandEventsWithOverrides` — 13-month window.
4. `filterOccurrencesForVenue` — Q-011 again.

### Test

`/lieu/[slug]` page.

---

## Q-018 · `getEventsForExportUncached`

| Field | Value |
|-------|--------|
| **File** | `src/lib/events/queries.ts` |
| **Lines** | 355–398 |
| **Tags** | FULL-EVENTS or scoped, N+1, FAT-ROW |

### Queries

1. `fetchMasterEvents` — Q-001 or Q-014/015.
2. `loadOverridesForEvents(all master ids)`.
3. **`Promise.all(masters.map(async …))`** — per master with org/venue override: up to **2× `findFirst`** each (373–385).

### Call chain

`getFilteredEventsForExport` → `buildIcalFeedResponse` (`src/lib/ical/feed.ts`).

### Problem

N+1 on organizations/venues when many master overrides exist. Needs `ical_data` for export — **keep fat row here**, but avoid N+1.

### Suggested fix

Collect unique org/venue IDs from patches → single `findMany` each (like `loadRelationMaps` in expand-with-overrides).

### Test

- `/api/ical/e30=.ics` downloads valid ICS.
- Filtered feed URLs with venue/org payload.

---

## Q-019 · `loadOverridesForEvents`

| Field | Value |
|-------|--------|
| **File** | `src/lib/events/overrides.ts` |
| **Lines** | 46–58 |
| **Exported** | Yes |
| **Tags** | (OK when `eventIds` small) |

### Query

```ts
db.query.eventOverrides.findMany({
  where: inArray(eventOverrides.eventId, eventIds),
});
```

### Problem

**Efficient pattern** when `eventIds` is bounded. Becomes costly when called with **all** master IDs from Q-001 (thousands of override rows).

### Test

Admin override panel still loads occurrence + master overrides.

---

## Q-020 · `loadEventWithMasterOverride` / `resolveEventBySlugUncached`

| Field | Value |
|-------|--------|
| **File** | `src/lib/events/queries.ts` |
| **Lines** | 113–145, 151–184 |
| **Tags** | N+1 (single event — acceptable), FAT-ROW |

### Queries

- `events.findFirst` + relations by slug.
- If duplicate: second `findFirst` for canonical.
- `loadOverridesForEvents([id])`.
- Optional extra `organizations` / `venues` `findFirst` per override patch (124–137).

### Call chain

`/evenement/[slug]`, iCal per-event routes, `resolveEventsBySlugs` in feed (loop — **Q-021**).

### Suggested fix

For single event: fine. For feed slug list: batch slugs in one query.

### Test

Event detail page; canonical redirect slug works.

---

## Q-021 · `resolveEventsBySlugs`

| Field | Value |
|-------|--------|
| **File** | `src/lib/ical/feed.ts` |
| **Lines** | 62–77 |
| **Tags** | N+1 |

### Behavior

```ts
for (const slug of slugs) {
  await resolveEventBySlug(slug);  // 2-4 queries each
}
```

### Test

iCal payload with `event: ["slug-a","slug-b"]` — both in feed.

---

# P1 — Admin & stats

## Q-022 · `loadMasterEvents`

| Field | Value |
|-------|--------|
| **File** | `src/lib/events/admin-events-table.ts` |
| **Lines** | 232–242 |
| **Visibility** | private |
| **Tags** | NO-PAGINATION, FAT-ROW |

### Query

```ts
db.query.events.findMany({
  where: isNull(events.canonicalEventId),
  with: {
    source: true,
    organization: true,
    venue: true,
    overrides: true,
  },
});
```

### Call chain

```
loadMergedMasterEvents (244)
  → mergeMastersWithMasterOverrides
getAdminEventsFilterOptions (252)
listAdminEventsTable (329)   // paginates in memory AFTER load
```

### Problem

Every admin events page load / filter dropdown build loads **all** events + all overrides relation.

### Suggested fix

- SQL `LIMIT/OFFSET` or keyset on sorted column.
- Filter options: separate lightweight `SELECT DISTINCT` queries.
- Do not load `overrides: true` for table rows; only `exists` flag or count.

### Test

`/admin/events?page=2` — correct rows and total count.
Filter by venue/org/state still works.

---

## Q-023 · `listAdminEventsTable`

| Field | Value |
|-------|--------|
| **File** | `src/lib/events/admin-events-table.ts` |
| **Lines** | 322–361 |
| **Tags** | NO-PAGINATION |

Uses Q-022 + `buildNextOccurrenceMap` (expands all recurring masters).

### Test

Sort columns (date, title, venue, org, state).

---

## Q-024 · `buildNextOccurrenceMap`

| Field | Value |
|-------|--------|
| **File** | `src/lib/events/event-scheduling.ts` |
| **Lines** | 12–37 |
| **Tags** | APP-FILTER |

### Behavior

No extra SQL; calls `expandMasterEventsToOccurrences(recurringMasters, getDefaultExpansionWindow())` — 13-month expansion for **all** recurring rows passed in.

### Call chain

`listAdminEventsTable`, `getEventConfirmQueue`, `getEventConfirmQueueStats`.

### Suggested fix

Narrow window to “next occurrence only” query or SQL `MIN(occurrence_start)`.

### Test

Admin table “next date” column for recurring events.

---

## Q-025 · `getEventConfirmQueue`

| Field | Value |
|-------|--------|
| **File** | `src/lib/events/confirm-queue.ts` |
| **Lines** | 47–98 |
| **Tags** | FAT-ROW |

### Query

```ts
db.query.events.findMany({
  where: and(isNull(canonicalEventId), isNull(confirmedAt)),
  with: { source, organization, venue },
});
```

All unconfirmed masters — then `buildNextOccurrenceMap` on recurring subset.

### Test

`/admin` confirm queue UI — pending events list.

---

## Q-026 · `getEventConfirmQueueStats`

| Field | Value |
|-------|--------|
| **File** | `src/lib/events/confirm-queue.ts` |
| **Lines** | 100–130 |
| **Tags** | (lighter)

### Query

```ts
events.findMany({
  where: isNull(canonicalEventId),
  columns: { id, confirmedAt, startAt, endAt, recurrenceRule },
});
```

Column-limited — **good pattern**. Still scans all masters.

### Call chain

`getAdminDashboardStats` (179).

### Test

Admin dashboard pending count.

---

## Q-027 · `getAdminDashboardStats`

| Field | Value |
|-------|--------|
| **File** | `src/lib/admin/dashboard-stats.ts` |
| **Lines** | 168–197 |
| **Tags** | FULL-EVENTS (via `getUpcomingEventsUncached`) |

### Parallel queries

- `getEventConfirmQueueStats` — Q-026.
- `getVenuePendingConfirmationCount` → `listVenuesWithStats` — Q-028.
- **`getUpcomingEventsUncached()`** — full Q-001 + expansion (only needs organizer count!).
- `getSourceCounts` — aggregated ✓.
- `getLastSyncLog` — single row ✓.

### Suggested fix

Replace upcoming-events load with `SELECT COUNT(DISTINCT organization_id) …` or count from slimmer query.

### Test

`/admin` dashboard cards: upcoming count, active organizers.

---

## Q-028 · `listVenuesWithStats`

| Field | Value |
|-------|--------|
| **File** | `src/lib/venues/matching.ts` |
| **Lines** | 131–141 |
| **Exported** | Yes |
| **Tags** | FULL-VENUES, FULL-EVENTS (via counts) |

### Queries (parallel)

1. `venues.findMany` — all venues, all columns.
2. `computeEffectiveVenueEventCounts()` — Q-029.
3. `eventOverrides.findMany` (master only) — all overrides with venue patch.

### Call chain

`listVenuesAdmin`, `getAdminDashboardStats`, venue merge tool, duplicates API.

### Test

`/admin/venues` — event counts per venue, override counts.

---

## Q-029 · `computeEffectiveVenueEventCounts`

| Field | Value |
|-------|--------|
| **File** | `src/lib/venues/effective-venue.ts` |
| **Lines** | 142–177 |
| **Tags** | FULL-EVENTS (slim columns ✓) |

### Queries

- `events.findMany({ columns: { id, venueId } })` — all masters.
- `eventOverrides.findMany` (master-only columns).
- `loadVenueCanonicalMap`.

### Problem

Correct logic, full scan. Acceptable for admin if cached; runs on every `listVenuesWithStats`.

### Suggested fix

Materialized count table updated on sync/write, or SQL `GROUP BY` with override join.

### Test

Venue list event counts match manual spot check.

---

## Q-030 · `computeEffectiveOrganizationEventCounts`

| Field | Value |
|-------|--------|
| **File** | `src/lib/organizations/effective-organization.ts` |
| **Lines** | 80–116 |
| **Tags** | FULL-EVENTS (slim columns ✓) |

### Call chain

`listAdminOrganizations` (`src/lib/organizations/admin.ts:82`).

### Test

`/admin/organizations` source/event counts.

---

## Q-031 · `listAdminEvents`

| Field | Value |
|-------|--------|
| **File** | `src/lib/events/queries.ts` |
| **Lines** | 699–710 |
| **Tags** | FAT-ROW |

### Query

```ts
db.query.events.findMany({
  with: { source, organization, venue, overrides },
  orderBy: desc(updatedAt),
  limit: 50,
});
```

Limited to 50 — **acceptable** for dashboard widget; still fat rows.

### Test

Where used — grep `listAdminEvents`.

---

## Q-032 · `findEventsForVenueAssignment`

| Field | Value |
|-------|--------|
| **File** | `src/lib/venues/matching.ts` |
| **Lines** | 430–450 |
| **Tags** | FULL-EVENTS (slim columns ✓) |

Loads all non-canonical events `{ id, venueId, locationRaw }` then filters in JS.

### Test

Admin venue merge / bulk assign tool.

---

# P2 — Secondary / lower traffic

## Q-033 · `listOrganizersForVenueUncached`

| Field | Value |
|-------|--------|
| **File** | `src/lib/events/queries.ts` |
| **Lines** | 648–684 |

`fetchMastersForVenue` + 13-month expansion + `organizations.findMany` — heavy but venue-scoped masters.

**Test:** Organizers block on venue page.

---

## Q-034 · `loadEventWithMasterOverride` N+1 in `getEventsForExportUncached`

See **Q-018** (same issue, listed separately for implementers fixing export only).

---

## Q-035 · `resolveRootCanonicalVenueId`

| Field | Value |
|-------|--------|
| **File** | `src/lib/venues/canonical.ts` |
| **Lines** | 65–68 |

Calls `loadVenueCanonicalMap()` per invocation — batch in callers.

---

## Q-036 · `resolveEventBySlug` / duplicate canonical chain

| Field | Value |
|-------|--------|
| **File** | `src/lib/events/duplicates.ts` |
| **Lines** | 27–44 |

Up to 8× `findFirst` walking `canonical_event_id` — rare admin path.

---

## Q-037 · `getDuplicateLinkInfo` / `findDuplicateCandidates`

| Field | Value |
|-------|--------|
| **File** | `src/lib/events/duplicates.ts` |
| **Lines** | 46–115 |

`findDuplicateCandidates` uses time window + limit — **good SQL pattern**. `fetchEventMaster` uses full relations — OK for admin detail.

**Test:** Admin duplicate linking UI.

---

## Q-038 · `getSitemapData`

| Field | Value |
|-------|--------|
| **File** | `src/app/sitemap.ts` |
| **Lines** | 21–33 |

Slim `select` on slug + `updatedAt` only — **good pattern**.

**Problem:** Paired with `listEventArchiveMonthsUncached` (Q-004) outside cache in same `sitemap()`.

---

## Q-039 · Admin pages loading full venue/org lists

| File | Lines | Query |
|------|-------|--------|
| `src/app/admin/(dashboard)/sources/page.tsx` | 31–38 | `organizations.findMany`, `venues.findMany` |
| `src/app/admin/(dashboard)/organizations/page.tsx` | 31 | `venues.findMany` |

Low volume admin traffic; optional slim `columns`.

---

## Q-040 · `listVenues` (public)

| Field | Value |
|-------|--------|
| **File** | `src/lib/events/queries.ts` |
| **Lines** | 520–532 |

Principal venues only (`canonicalVenueId IS NULL`) — OK.

---

## Q-041 · `GET /api/events` admin branch

| Field | Value |
|-------|--------|
| **File** | `src/app/api/events/route.ts` |
| **Lines** | 49–56 |

If admin cookie: `loadOverridesForEvents(masterIds)` for displayed occurrences — proportional to result size, not full table.

---

# Duplicate / redundant fetches (fix with parent)

| ID | Location | Issue |
|----|----------|--------|
| R-01 | `getUpcomingEventsUncached` 260–262 | Org looked up in `fetchMasterEvents` and again for filter |
| R-02 | `getVenueBySlugUncached` | `resolveVenueBySlug` + `fetchMastersForVenue` + `filterOccurrencesForVenue` each touch canonical map |
| R-03 | `buildIcalFeedResponse` | `getFilteredEventsForExport` loads overrides; `buildIcalFeedResponse` loads overrides again (167) |

---

# Positive patterns (keep as reference)

| Function | File | Why it's good |
|----------|------|----------------|
| `getSitemapData` | `sitemap.ts` | Minimal columns |
| `getEventConfirmQueueStats` | `confirm-queue.ts` | Column projection |
| `findDuplicateCandidates` | `duplicates.ts` | Time range + `limit` in SQL |
| `loadMasterVenueOverrides` | `effective-venue.ts` | Filtered by `eventIds` + master-only |
| `loadRelationMaps` | `expand-with-overrides.ts` | Batch `inArray` for org/venue |
| `getSourceCounts` | `dashboard-stats.ts` | `GROUP BY` aggregate |

---

# Suggested implementation order for humans

1. **Q-012** — one canonical map per sync (quick win in sync).
2. **Q-006, Q-007, Q-009** — batch sync writes.
3. **Q-001, Q-002** — SQL date filter + slim columns on public lists.
4. **Q-010, Q-013** — override SQL filters.
5. **Q-004** — archive months SQL.
6. **Q-022, Q-023** — admin SQL pagination.
7. **Q-018, R-03** — export N+1 and duplicate override loads.
8. **Q-011** — memoize canonical map per request.

---

# File index (all functions with unoptimized patterns)

| File | Functions / IDs |
|------|-----------------|
| `src/lib/events/queries.ts` | Q-001, Q-002, Q-016, Q-017, Q-018, Q-020, Q-004, Q-033, Q-031, Q-040, R-01 |
| `src/lib/events/expand-with-overrides.ts` | Q-003 |
| `src/lib/events/agenda-filter-options.ts` | Q-005 |
| `src/lib/events/admin-events-table.ts` | Q-022, Q-023 |
| `src/lib/events/event-scheduling.ts` | Q-024 |
| `src/lib/events/confirm-queue.ts` | Q-025, Q-026 |
| `src/lib/events/overrides.ts` | Q-019 |
| `src/lib/events/duplicates.ts` | Q-036, Q-037 |
| `src/lib/venues/effective-venue.ts` | Q-010, Q-014, Q-029 |
| `src/lib/venues/canonical.ts` | Q-011, Q-012, Q-035 |
| `src/lib/venues/find-or-create.ts` | Q-009 |
| `src/lib/venues/matching.ts` | Q-028, Q-032 |
| `src/lib/organizations/effective-organization.ts` | Q-013, Q-015, Q-030 |
| `src/lib/ical/sync.ts` | Q-006, Q-007, Q-008 |
| `src/lib/ical/feed.ts` | Q-021, R-03 |
| `src/lib/admin/dashboard-stats.ts` | Q-027 |
| `src/lib/organizations/admin.ts` | Q-030 |
| `src/app/sitemap.ts` | Q-038, Q-004 |
| `src/app/api/events/route.ts` | Q-041 |
| `src/app/api/cron/sync/route.ts` | Q-008 side-effect |

---

*Last updated: 2026-06-04 — regenerate after schema or query refactors.*
