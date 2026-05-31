<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into Swingin Toulouse, a Next.js 16 App Router application.

**Changes made:**

- **`instrumentation-client.ts`** (new) — Client-side PostHog initialization using `posthog-js`. Initializes on every page load with the EU host, exception capture, and a `/swingest` reverse proxy.
- **`next.config.ts`** — Added three reverse proxy rewrites (`/swingest/static/*`, `/swingest/array/*`, `/swingest/*`) routing to `eu-assets.i.posthog.com` / `eu.i.posthog.com`, plus `skipTrailingSlashRedirect: true`.
- **`src/lib/posthog-server.ts`** (new) — Singleton server-side PostHog client (`posthog-node`) for use in API routes.
- **`src/components/events/agenda-filters.tsx`** — Captures `agenda_filter_applied` (with `filter_type` and `values` properties) and `agenda_filter_cleared` client-side events.
- **`src/components/events/agenda-view.tsx`** — Captures `agenda_view_changed` (with `view` property) when users toggle between Agenda and Planning modes.
- **`src/components/events/event-details.tsx`** — Marked as `"use client"` and captures `event_external_link_clicked` (with `event_slug` and `source_url`) when users click the external source link.
- **`src/app/api/ical/[payload].ics/route.ts`** — Server-side `calendar_feed_downloaded` event with `has_org_filter` and `has_event_filter` properties.
- **`src/app/api/ical/evenement/[slug]/route.ts`** — Server-side `event_ical_downloaded` event with `event_slug`.
- **`src/app/api/ical/organisateur/[slug]/route.ts`** — Server-side `organizer_calendar_subscribed` event with `organizer_slug`.

## Events

| Event | Description | File |
|-------|-------------|------|
| `agenda_filter_applied` | User applies a filter (category, venue, or organizer) on the agenda page | `src/components/events/agenda-filters.tsx` |
| `agenda_filter_cleared` | User clears all active filters on the agenda page | `src/components/events/agenda-filters.tsx` |
| `agenda_view_changed` | User switches between agenda and planning view modes | `src/components/events/agenda-view.tsx` |
| `event_external_link_clicked` | User clicks the external source link for an event | `src/components/events/event-details.tsx` |
| `calendar_feed_downloaded` | User downloads the full iCal calendar feed | `src/app/api/ical/[payload].ics/route.ts` |
| `event_ical_downloaded` | User downloads an individual event's iCal file | `src/app/api/ical/evenement/[slug]/route.ts` |
| `organizer_calendar_subscribed` | User subscribes to an organizer's iCal feed | `src/app/api/ical/organisateur/[slug]/route.ts` |
| `home_hero_shown` | Hero variant shown on homepage (A/B test exposure) | `src/components/home/use-home-hero-experiment.ts` |
| `home_hero_agenda_clicked` | User clicks "Voir l'agenda" in homepage hero | `src/components/home/heroes/hero-shared.tsx` |
| `home_hero_calendar_clicked` | User clicks "S'abonner au calendrier" in homepage hero | `src/components/home/heroes/hero-shared.tsx` |

## A/B test — homepage hero (`home-hero`)

Flag multivarié unique avec payloads JSON :

| Variant key | Payload | Rollout |
|---|---|---|
| `a_vinyl` | `{ "variant": "a", "illustration": "vinyl" }` | 12.5 % |
| `a_scene` | `{ "variant": "a", "illustration": "scene" }` | 12.5 % |
| `b` | `{ "variant": "b" }` | 25 % |
| `c` | `{ "variant": "c" }` | 25 % |
| `d` | `{ "variant": "d" }` | 25 % |

- **Exposition** : `home_hero_shown` (propriétés `flag_variant`, `hero_layout_variant`, `hero_art_variant` si A)
- **Objectifs** : `home_hero_agenda_clicked`, `home_hero_calendar_clicked`

Preview manuel : `/?hero-preview=1` · Override : `/?hero=c` ou `/?art=scene`

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics dashboard](/dashboard/714367)
- [Calendar subscriptions over time](/insights/Wvr8c34C)
- [Agenda filter usage by type](/insights/rnIHIsB9)
- [External event link clicks](/insights/Jp2GkaEM)
- [Total calendar subscriptions (30d)](/insights/xk3TCKR7)
- [Agenda view mode preference](/insights/NQHiDpMv)

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
