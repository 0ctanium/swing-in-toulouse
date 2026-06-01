# Roadmap

## Todo

- [x] Set alias to permanent by default
- [ ] Allow venues to have any kind of address (cities, etc)
- [x] Detect similar venues by comparing similar addresses (and not only name)
- [ ] Dismiss a venue being incorrect, and keep it unconfirmed
- [ ] Allow to automatically attribute org when and event has the same venue has the org address. Or at least suggest it in the event confirmation
- [ ] Update the scrapper to find events from group discussions.
- [ ] Allow to hide event from the override form. If already possible, improve UI for it
- [ ] Fix OG images text overflow
- [ ] Change popover cards to have all links redirect to the matching entity card rather than the meta line to prevent users going on the venue from the event card, even if he clicked on the venue link.
- [ ] Investigate why for TRAC, related events are not shown.

## Completed

### Foundation

- [x] Swing Toulouse agenda app with iCal sync and calendar views (month + planning)
- [x] PostgreSQL data model: organizers, sources, venues, events, overrides
- [x] Hourly iCal sync via Upstash QStash
- [x] TanStack Query hooks for all client API calls
- [x] Site branding, icons, and web app manifest
- [x] Light, dark, and system theme switching in the footer
- [x] Legal pages (LCEN + RGPD) as native MDX
- [x] Cache components for public pages with isolated admin auth
- [x] Vercel Speed Insights in the root layout
- [x] Entity-feature-builder agent for full-stack entity features

### iCal sync & sources

- [x] iCal sync that detects real event changes only
- [x] Per-source defaults for location and categories during sync
- [x] Sources admin CRUD with data table and dialog forms
- [x] iCal-file sources with Vercel Blob storage and admin upload sync
- [x] Chrome extension to export Facebook group events to iCal (`tools/scrap/`)

### Events & overrides

- [x] Event override system with admin calendar and in-context admin mode
- [x] Extended iCal event metadata on cards and detail pages
- [x] Admin event confirmation workflow for synced iCal events
- [x] Filterable admin events table (replaced agenda-style admin view)
- [x] Apply overrides in admin counts, events table, and public organizer/venue listings
- [x] Improved event page layout; sync sources kept off public surfaces

### Venues & locations

- [x] Automatic venue creation from iCal `LOCATION` fields
- [x] Duplicate merging, venue matching tools, and name-based venue slugs
- [x] Google venue address confirmation and iCal quality hints
- [x] Permanent venue aliases with canonical redirects and merge UI
- [x] Venue categories with admin editing and public badges
- [x] Venues admin CRUD with data table, dialogs, and merge page
- [x] Manual venue reassignment table in admin
- [x] Venue details with cached Google Maps integration on public pages
- [x] Fix Google address parsing; show confirmed venue data on public pages

### Organizations

- [x] Organizations admin CRUD; link venues by ID only
- [x] Organization categories and location linking to venues
- [x] Organization dance styles and social links on admin and homepage
- [x] Optional org venue on events

### Agenda & calendar UX

- [x] URL-persisted multi-select filters and cookie-backed view preferences
- [x] Compact Google-style planning view with shared event popovers
- [x] Calendar subscribe dialog with app-specific CTAs (Google Calendar, Apple, etc.)
- [x] Global iCal subscribe dialog accessible from mobile menu and homepage
- [x] Consolidated iCal feeds behind a single payload-based route
- [x] Enriched iCal export with resolved locations, overrides, and map metadata
- [x] Vaul day drawer to open full event list when tapping a calendar day
- [x] Mobile agenda: planning default, collapsed filters, compact toolbar
- [x] Mobile month calendar: full-width grid and compact event chips
- [x] Server-prefetched agenda queries; filters stay interactive while loading
- [x] Multi-day calendar events rendered as spanning pills in month view
- [x] PostHog analytics for agenda usage and calendar downloads

### Admin

- [x] Reorganized admin navigation with entity sub-nav
- [x] shadcn combobox and unified `VenueSelect` across admin forms
- [x] "Voir" action on admin data tables linking to public pages
- [x] Admin Réglages page to classify event category tags
- [x] Admin dashboard with operational metrics and external tool links
- [x] Block search engines from indexing admin routes
- [x] Site header and admin banner in the root layout

### Public site & SEO

- [x] Homepage community section (WhatsApp, Facebook, external resources incl. Swingspots)
- [x] Navbar links to community and schools sections on the homepage
- [x] Multi-variant homepage heroes with PostHog A/B testing (server-evaluated flags)
- [x] SEO hub pages, breadcrumbs, and structured data
- [x] Dynamic Open Graph images for events, organizers, and venues
- [x] Public pages for organizers (`/organisateur/[slug]`) and venues (`/lieu/[slug]`)
