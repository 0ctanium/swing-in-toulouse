import { addDays } from "date-fns";
import { cacheLife, cacheTag } from "next/cache";
import { cache } from "react";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";

import { db } from "@/db";
import { CACHE_TAGS } from "@/lib/cache/tags";
import { PUBLIC_PAGE_REVALIDATE, SITEMAP_REVALIDATE } from "@/lib/cache/revalidate";
import { events, organizations, venues } from "@/db/schema";
import { expandEventsWithOverrides } from "@/lib/events/expand-with-overrides";
import {
  collectArchiveMonthsFromOccurrences,
  getArchiveLookbackStart,
  getLastCompleteArchiveMonthEnd,
  getMonthWindowInSiteTimezone,
  type ArchiveMonth,
} from "@/lib/events/hub";
import {
  applyMasterOverride,
  loadOverridesForEvents,
} from "@/lib/events/overrides";
import {
  fetchMastersForVenue,
  filterOccurrencesForVenue,
} from "@/lib/venues/effective-venue";
import { loadOrganizationDisplayVenue } from "@/lib/organizations/location";
import {
  fetchMastersForOrganization,
  filterOccurrencesForOrganization,
} from "@/lib/organizations/effective-organization";
import { resolveVenueBySlug } from "@/lib/venues/canonical";
import {
  getDefaultExpansionWindow,
  getDefaultFromDate,
  isMasterRelevantForExport,
  type EventOccurrence,
  type ExpansionWindow,
} from "@/lib/ical/recurrence";
import type { EventMaster } from "@/db/schema";

async function fetchMasterEvents(options?: {
  organizationSlug?: string;
  venueSlug?: string;
  includeCancelled?: boolean;
}) {
  const filters = [];

  if (!options?.includeCancelled) {
    filters.push(eq(events.status, "published"));
  }

  filters.push(isNull(events.canonicalEventId));

  if (options?.organizationSlug) {
    const organization = await db.query.organizations.findFirst({
      where: eq(organizations.slug, options.organizationSlug),
    });

    if (!organization) {
      return [];
    }

    return fetchMastersForOrganization(organization.id, {
      includeCancelled: options?.includeCancelled,
    });
  }

  if (options?.venueSlug) {
    const venue = await db.query.venues.findFirst({
      where: eq(venues.slug, options.venueSlug),
    });

    if (!venue) {
      return [];
    }

    return fetchMastersForVenue(venue.id, {
      includeCancelled: options?.includeCancelled,
    });
  }

  return db.query.events.findMany({
    where: filters.length > 0 ? and(...filters) : undefined,
    with: {
      source: true,
      organization: true,
      venue: true,
    },
    orderBy: (eventsTable, { asc }) => [asc(eventsTable.startAt)],
  }) as Promise<EventMaster[]>;
}

function filterOccurrences(
  occurrences: EventOccurrence[],
  window: ExpansionWindow,
  limit?: number,
) {
  const filtered = occurrences.filter((occurrence) => {
    if (occurrence.startAt >= window.from && occurrence.startAt <= window.to) {
      return true;
    }

    return Boolean(
      occurrence.endAt &&
        occurrence.endAt >= window.from &&
        occurrence.startAt <= window.to,
    );
  });

  return limit ? filtered.slice(0, limit) : filtered;
}

async function loadEventWithMasterOverride(event: EventMaster) {
  const overrides = await loadOverridesForEvents([event.id]);
  const masterOverride = overrides.master.get(event.id);

  if (!masterOverride) {
    return event;
  }

  const organization =
    masterOverride.patch.organizationId !== undefined
      ? masterOverride.patch.organizationId
        ? await db.query.organizations.findFirst({
            where: eq(organizations.id, masterOverride.patch.organizationId),
          })
        : null
      : event.organization;

  const venue =
    masterOverride.patch.venueId !== undefined
      ? masterOverride.patch.venueId
        ? await db.query.venues.findFirst({
            where: eq(venues.id, masterOverride.patch.venueId),
          })
        : null
      : event.venue;

  return applyMasterOverride(event, masterOverride, {
    organizations: new Map(
      organization ? [[organization.id, organization]] : [],
    ),
    venues: new Map(venue ? [[venue.id, venue]] : []),
  });
}

export type EventSlugResolution =
  | { kind: "event"; event: EventMaster }
  | { kind: "redirect"; targetSlug: string };

async function resolveEventBySlugUncached(
  slug: string,
): Promise<EventSlugResolution | null> {
  const row = await db.query.events.findFirst({
    where: eq(events.slug, slug),
    with: {
      source: true,
      organization: true,
      venue: true,
    },
  });

  if (!row) {
    return null;
  }

  if (row.canonicalEventId) {
    const canonical = await db.query.events.findFirst({
      where: eq(events.id, row.canonicalEventId),
      with: {
        source: true,
        organization: true,
        venue: true,
      },
    });

    if (canonical) {
      return { kind: "redirect", targetSlug: canonical.slug };
    }
  }

  const event = await loadEventWithMasterOverride(row as EventMaster);
  return { kind: "event", event };
}

type UpcomingEventsOptions = {
  organizationSlug?: string;
  venueSlug?: string;
  includeCancelled?: boolean;
  from?: Date;
  to?: Date;
  daysAhead?: number;
  limit?: number;
};

type UpcomingEventsCacheKey = {
  organizationSlug?: string;
  venueSlug?: string;
  includeCancelled?: boolean;
  fromIso?: string;
  toIso?: string;
  daysAhead?: number;
  limit?: number;
};

function toUpcomingEventsCacheKey(
  options?: UpcomingEventsOptions,
): UpcomingEventsCacheKey {
  return {
    organizationSlug: options?.organizationSlug,
    venueSlug: options?.venueSlug,
    includeCancelled: options?.includeCancelled,
    fromIso: options?.from?.toISOString(),
    toIso: options?.to?.toISOString(),
    daysAhead: options?.daysAhead,
    limit: options?.limit,
  };
}

function resolveUpcomingEventsWindow(key: UpcomingEventsCacheKey) {
  const from = key.fromIso ? new Date(key.fromIso) : getDefaultFromDate();
  const to = key.toIso
    ? new Date(key.toIso)
    : key.daysAhead
      ? addDays(from, key.daysAhead)
      : getDefaultExpansionWindow(from).to;

  return { from, to };
}

export async function getUpcomingEventsUncached(options?: UpcomingEventsOptions): Promise<
  EventOccurrence[]
> {
  const from = options?.from ?? getDefaultFromDate();
  const window: ExpansionWindow = {
    from,
    to: options?.to ?? getDefaultExpansionWindow(from).to,
  };

  let venueId: string | undefined;
  if (options?.venueSlug) {
    const resolution = await resolveVenueBySlug(options.venueSlug);

    if (!resolution || resolution.kind === "redirect") {
      return [];
    }

    venueId = resolution.venue.id;
  }

  const masters = await fetchMasterEvents({
    organizationSlug: options?.organizationSlug,
    venueSlug: options?.venueSlug,
    includeCancelled: options?.includeCancelled,
  });

  let occurrences = await expandEventsWithOverrides(masters, window);

  if (options?.organizationSlug) {
    const organization = await db.query.organizations.findFirst({
      where: eq(organizations.slug, options.organizationSlug),
    });

    if (organization) {
      occurrences = filterOccurrencesForOrganization(
        occurrences,
        organization.id,
      );
    }
  }

  if (venueId) {
    occurrences = await filterOccurrencesForVenue(occurrences, venueId);
  }

  return filterOccurrences(occurrences, window, options?.limit);
}

async function getEventBySlugUncached(slug: string) {
  const resolution = await resolveEventBySlugUncached(slug);

  if (!resolution) {
    return null;
  }

  if (resolution.kind === "redirect") {
    return resolveEventBySlugUncached(resolution.targetSlug).then((resolved) =>
      resolved?.kind === "event" ? resolved.event : null,
    );
  }

  return resolution.event;
}

async function getOrganizerBySlugUncached(slug: string) {
  const organization = await db.query.organizations.findFirst({
    where: eq(organizations.slug, slug),
  });

  if (!organization) {
    return null;
  }

  const venue = await loadOrganizationDisplayVenue(organization.venueId);

  const masters = await fetchMastersForOrganization(organization.id);

  const window = getDefaultExpansionWindow();
  const occurrences = await expandEventsWithOverrides(masters, window);

  return {
    ...organization,
    venue,
    events: filterOccurrences(
      filterOccurrencesForOrganization(occurrences, organization.id),
      window,
    ),
  };
}

async function getVenueBySlugUncached(slug: string) {
  const resolution = await resolveVenueBySlug(slug);

  if (!resolution) {
    return null;
  }

  if (resolution.kind === "redirect") {
    return null;
  }

  const venue = resolution.venue;

  const masters = await fetchMastersForVenue(venue.id, {
    includeCancelled: false,
  });

  const window = getDefaultExpansionWindow();
  const occurrences = await expandEventsWithOverrides(masters, window);

  return {
    ...venue,
    events: filterOccurrences(
      await filterOccurrencesForVenue(occurrences, venue.id),
      window,
    ),
  };
}

type EventsForExportCacheKey = {
  organizationSlug?: string;
  venueSlug?: string;
};

async function getEventsForExportUncached(options?: EventsForExportCacheKey) {
  const from = getDefaultFromDate();
  const masters = await fetchMasterEvents({
    organizationSlug: options?.organizationSlug,
    venueSlug: options?.venueSlug,
  });

  const overrides = await loadOverridesForEvents(masters.map((m) => m.id));
  const merged = await Promise.all(
    masters.map(async (master) => {
      const masterOverride = overrides.master.get(master.id);
      if (!masterOverride) {
        return master;
      }

      const organization =
        masterOverride.patch.organizationId !== undefined
          ? masterOverride.patch.organizationId
            ? await db.query.organizations.findFirst({
                where: eq(organizations.id, masterOverride.patch.organizationId),
              })
            : null
          : master.organization;

      const venue =
        masterOverride.patch.venueId !== undefined
          ? masterOverride.patch.venueId
            ? await db.query.venues.findFirst({
                where: eq(venues.id, masterOverride.patch.venueId),
              })
            : null
          : master.venue;

      return applyMasterOverride(master, masterOverride, {
        organizations: new Map(
          organization ? [[organization.id, organization]] : [],
        ),
        venues: new Map(venue ? [[venue.id, venue]] : []),
      });
    }),
  );

  return merged.filter((master) => isMasterRelevantForExport(master, from));
}

export async function listOrganizersUncached() {
  return db.query.organizations.findMany({
    where: eq(organizations.isActive, true),
    orderBy: (table, { asc }) => [asc(table.name)],
  });
}

async function resolveEventBySlugCached(slug: string) {
  "use cache";
  cacheLife({
    stale: PUBLIC_PAGE_REVALIDATE,
    revalidate: PUBLIC_PAGE_REVALIDATE,
  });
  cacheTag(CACHE_TAGS.events, `event-slug-${slug}`);

  return resolveEventBySlugUncached(slug);
}

export const resolveEventBySlug = cache(resolveEventBySlugCached);

async function getUpcomingEventsCached(key: UpcomingEventsCacheKey) {
  "use cache";
  cacheLife({
    stale: PUBLIC_PAGE_REVALIDATE,
    revalidate: PUBLIC_PAGE_REVALIDATE,
  });
  cacheTag(CACHE_TAGS.events);

  const { from, to } = resolveUpcomingEventsWindow(key);

  return getUpcomingEventsUncached({
    organizationSlug: key.organizationSlug,
    venueSlug: key.venueSlug,
    includeCancelled: key.includeCancelled,
    from,
    to,
    limit: key.limit,
  });
}

export async function getUpcomingEvents(options?: UpcomingEventsOptions) {
  return getUpcomingEventsCached(toUpcomingEventsCacheKey(options));
}

async function getEventBySlugCached(slug: string) {
  "use cache";
  cacheLife({
    stale: PUBLIC_PAGE_REVALIDATE,
    revalidate: PUBLIC_PAGE_REVALIDATE,
  });
  cacheTag(CACHE_TAGS.events, `event-slug-${slug}`);

  return getEventBySlugUncached(slug);
}

export const getEventBySlug = cache(getEventBySlugCached);

async function getOrganizerBySlugCached(slug: string) {
  "use cache";
  cacheLife({
    stale: PUBLIC_PAGE_REVALIDATE,
    revalidate: PUBLIC_PAGE_REVALIDATE,
  });
  cacheTag(CACHE_TAGS.organizers, CACHE_TAGS.events, `organizer-${slug}`);

  return getOrganizerBySlugUncached(slug);
}

export const getOrganizerBySlug = cache(getOrganizerBySlugCached);

/** @deprecated Use getOrganizerBySlug */
export const getOrganizationBySlug = getOrganizerBySlug;

export { resolveVenueBySlug };
export type { VenueSlugResolution } from "@/lib/venues/canonical";

async function getVenueBySlugCached(slug: string) {
  "use cache";
  cacheLife({
    stale: PUBLIC_PAGE_REVALIDATE,
    revalidate: PUBLIC_PAGE_REVALIDATE,
  });
  cacheTag(CACHE_TAGS.venues, CACHE_TAGS.events, `venue-${slug}`);

  return getVenueBySlugUncached(slug);
}

export const getVenueBySlug = cache(getVenueBySlugCached);

async function getEventsForExportCached(options?: EventsForExportCacheKey) {
  "use cache";
  cacheLife({
    stale: PUBLIC_PAGE_REVALIDATE,
    revalidate: PUBLIC_PAGE_REVALIDATE,
  });
  cacheTag(CACHE_TAGS.events);

  return getEventsForExportUncached(options);
}

export async function getEventsForExport(options?: EventsForExportCacheKey) {
  return getEventsForExportCached(options);
}

async function listOrganizersCached() {
  "use cache";
  cacheLife({
    stale: SITEMAP_REVALIDATE,
    revalidate: SITEMAP_REVALIDATE,
  });
  cacheTag(CACHE_TAGS.organizers);

  return listOrganizersUncached();
}

export const listOrganizers = cache(listOrganizersCached);

/** @deprecated Use listOrganizers */
export const listOrganizations = listOrganizers;

async function listVenuesCached() {
  "use cache";
  cacheLife({
    stale: SITEMAP_REVALIDATE,
    revalidate: SITEMAP_REVALIDATE,
  });
  cacheTag(CACHE_TAGS.venues);

  return db.query.venues.findMany({
    where: isNull(venues.canonicalVenueId),
    orderBy: (table, { asc }) => [asc(table.name)],
  });
}

export const listVenues = cache(listVenuesCached);

export async function listUpcomingEventsForHubUncached() {
  const from = getDefaultFromDate();
  const { to } = getDefaultExpansionWindow(from);

  return getUpcomingEventsUncached({ from, to });
}

async function listUpcomingEventsForHubCached() {
  "use cache";
  cacheLife({
    stale: PUBLIC_PAGE_REVALIDATE,
    revalidate: PUBLIC_PAGE_REVALIDATE,
  });
  cacheTag(CACHE_TAGS.events);

  return listUpcomingEventsForHubUncached();
}

export const listUpcomingEventsForHub = cache(listUpcomingEventsForHubCached);

export async function listEventsInMonthUncached(year: number, month: number) {
  const { from, to } = getMonthWindowInSiteTimezone(year, month);

  return getUpcomingEventsUncached({ from, to });
}

async function listEventsInMonthCached(year: number, month: number) {
  "use cache";
  cacheLife({
    stale: PUBLIC_PAGE_REVALIDATE,
    revalidate: PUBLIC_PAGE_REVALIDATE,
  });
  cacheTag(CACHE_TAGS.events, `events-month-${year}-${month}`);

  return listEventsInMonthUncached(year, month);
}

export const listEventsInMonth = cache(listEventsInMonthCached);

export async function listEventArchiveMonthsUncached(): Promise<ArchiveMonth[]> {
  const now = getDefaultFromDate();
  const from = getArchiveLookbackStart(now);
  const to = getLastCompleteArchiveMonthEnd(now);

  if (to < from) {
    return [];
  }

  const occurrences = await getUpcomingEventsUncached({ from, to });

  return collectArchiveMonthsFromOccurrences(occurrences, now);
}

async function listEventArchiveMonthsCached() {
  "use cache";
  cacheLife({
    stale: PUBLIC_PAGE_REVALIDATE,
    revalidate: PUBLIC_PAGE_REVALIDATE,
  });
  cacheTag(CACHE_TAGS.events);

  return listEventArchiveMonthsUncached();
}

export const listEventArchiveMonths = cache(listEventArchiveMonthsCached);

export async function getRelatedEventsUncached(
  slug: string,
  organizationSlug?: string | null,
  venueSlug?: string | null,
  limit = 5,
) {
  const from = getDefaultFromDate();
  const { to } = getDefaultExpansionWindow(from);

  let candidates: EventOccurrence[] = [];

  if (organizationSlug) {
    candidates = await getUpcomingEventsUncached({
      organizationSlug,
      from,
      to,
    });
  } else if (venueSlug) {
    candidates = await getUpcomingEventsUncached({
      venueSlug,
      from,
      to,
    });
  }

  return candidates.filter((item) => item.slug !== slug).slice(0, limit);
}

async function getRelatedEventsCached(
  slug: string,
  organizationSlug?: string | null,
  venueSlug?: string | null,
  limit = 5,
) {
  "use cache";
  cacheLife({
    stale: PUBLIC_PAGE_REVALIDATE,
    revalidate: PUBLIC_PAGE_REVALIDATE,
  });
  cacheTag(CACHE_TAGS.events, `related-events-${slug}`);

  return getRelatedEventsUncached(slug, organizationSlug, venueSlug, limit);
}

export const getRelatedEvents = cache(getRelatedEventsCached);

export async function listOrganizersForVenueUncached(venueId: string) {
  const [byHomeVenue, masters] = await Promise.all([
    db.query.organizations.findMany({
      where: and(
        eq(organizations.isActive, true),
        eq(organizations.venueId, venueId),
      ),
    }),
    fetchMastersForVenue(venueId),
  ]);

  const window = getDefaultExpansionWindow();
  const occurrences = await expandEventsWithOverrides(masters, window);
  const venueOccurrences = await filterOccurrencesForVenue(
    occurrences,
    venueId,
  );

  const organizationIds = new Set([
    ...byHomeVenue.map((organizer) => organizer.id),
    ...filterOccurrences(venueOccurrences, window)
      .map((occurrence) => occurrence.organization?.id)
      .filter((id): id is string => Boolean(id)),
  ]);

  if (organizationIds.size === 0) {
    return [];
  }

  return db.query.organizations.findMany({
    where: and(
      eq(organizations.isActive, true),
      inArray(organizations.id, [...organizationIds]),
    ),
    orderBy: (table, { asc }) => [asc(table.name)],
  });
}

async function listOrganizersForVenueCached(venueId: string) {
  "use cache";
  cacheLife({
    stale: PUBLIC_PAGE_REVALIDATE,
    revalidate: PUBLIC_PAGE_REVALIDATE,
  });
  cacheTag(CACHE_TAGS.organizers, CACHE_TAGS.venues, `venue-orgs-${venueId}`);

  return listOrganizersForVenueUncached(venueId);
}

export const listOrganizersForVenue = cache(listOrganizersForVenueCached);

export async function listAdminEvents(limit = 50) {
  return db.query.events.findMany({
    with: {
      source: true,
      organization: true,
      venue: true,
      overrides: true,
    },
    orderBy: [desc(events.updatedAt)],
    limit,
  });
}

export async function getAdminEventOccurrences(eventId: string) {
  const event = await db.query.events.findFirst({
    where: eq(events.id, eventId),
    with: {
      source: true,
      organization: true,
      venue: true,
    },
  });

  if (!event) {
    return null;
  }

  const window = getDefaultExpansionWindow();
  const occurrences = await expandEventsWithOverrides([event], window);

  return {
    event,
    occurrences: occurrences.filter((occurrence) => occurrence.startAt >= window.from),
  };
}

export type { EventOccurrence };
