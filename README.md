# Swing Toulouse

Agenda swing à Toulouse — import automatique depuis des sources iCal, avec export iCal public.

## Stack

- Next.js (App Router)
- Drizzle ORM + PostgreSQL (`pg` driver, transaction-ready)
- t3-env + Zod for environment validation
- shadcn/ui (Base UI) + Tailwind CSS
- Upstash QStash for hourly sync

## Getting started

### 1. Environment

```bash
cp .env.example .env.local
```

All env vars are validated at startup via [t3-env](https://env.t3.gg/). See `.env.example` for the full list.

### 2. Start local services (Postgres + QStash)

```bash
pnpm run docker:up
```

| Service | URL |
|---|---|
| PostgreSQL | `postgresql://swing:swing@localhost:5432/swing_in_toulouse` |
| QStash dev server | `http://localhost:8080` (logs on `:8081`) |

### 3. Database

```bash
pnpm run db:push
pnpm run db:seed
pnpm run sync
```

### 4. Register hourly sync with QStash

```bash
pnpm run qstash:setup
```

### 5. Dev server

```bash
pnpm run dev
```

## Data model

- **Organisateur** — école, asso, collectif (`/organisateur/[slug]`)
- **Source** — point de sync iCal, lié optionnellement à un organisateur
- **Lieu** — créé automatiquement depuis le champ `LOCATION` des événements iCal

See **[docs/donnees.md](./docs/donnees.md)** for how to add organizers, sources, and how venues work.

## iCal feeds

| URL | Description |
|---|---|
| `/ical/e30.ical` | All upcoming events (with RRULE) |
| `/ical/{payload}.ical` | Filtered feed (`payload` = base64url JSON: `category`, `venue`, `org`, `event`) |
| `/agenda.ics`, `/organisateur/[slug].ics`, `/evenement/[slug].ics` | Deprecated — 308 redirect to the canonical `/ical/…` URL |

## Scripts

| Command | Description |
|---|---|
| `pnpm run docker:up` | Start Postgres + QStash |
| `pnpm run db:push` | Push Drizzle schema |
| `pnpm run db:seed` | Seed organizers + sources |
| `pnpm run sync` | Sync all active sources |
| `pnpm run db:studio` | Open Drizzle Studio |

## Production

Use any PostgreSQL provider — set `DATABASE_URL` to a standard `postgresql://` connection string.

For QStash in production, set `CRON_SYNC_URL` to your deployed `/api/cron/sync` URL.
