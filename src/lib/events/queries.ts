import { and, desc, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { events, organizations, venues } from "@/db/schema";
import { expandEventsWithOverrides } from "@/lib/events/expand-with-overrides";
import {
  applyMasterOverride,
  loadOverridesForEvents,
} from "@/lib/events/overrides";
import {
  fetchMastersForVenue,
  filterOccurrencesForVenue,
} from "@/lib/venues/effective-venue";
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

    filters.push(eq(events.organizationId, organization.id));
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

export async function resolveEventBySlug(
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

export async function getUpcomingEvents(options?: {
  organizationSlug?: string;
  venueSlug?: string;
  includeCancelled?: boolean;
  from?: Date;
  to?: Date;
  limit?: number;
}): Promise<EventOccurrence[]> {
  const from = options?.from ?? getDefaultFromDate();
  const window: ExpansionWindow = {
    from,
    to: options?.to ?? getDefaultExpansionWindow(from).to,
  };

  let venueId: string | undefined;
  if (options?.venueSlug) {
    const venue = await db.query.venues.findFirst({
      where: eq(venues.slug, options.venueSlug),
    });

    if (!venue) {
      return [];
    }

    venueId = venue.id;
  }

  const masters = await fetchMasterEvents({
    organizationSlug: options?.organizationSlug,
    venueSlug: options?.venueSlug,
    includeCancelled: options?.includeCancelled,
  });

  let occurrences = await expandEventsWithOverrides(masters, window);

  if (venueId) {
    occurrences = filterOccurrencesForVenue(occurrences, venueId);
  }

  return filterOccurrences(occurrences, window, options?.limit);
}

export async function getEventBySlug(slug: string) {
  const resolution = await resolveEventBySlug(slug);

  if (!resolution) {
    return null;
  }

  if (resolution.kind === "redirect") {
    return resolveEventBySlug(resolution.targetSlug).then((resolved) =>
      resolved?.kind === "event" ? resolved.event : null,
    );
  }

  return resolution.event;
}

export async function getOrganizerBySlug(slug: string) {
  const organization = await db.query.organizations.findFirst({
    where: eq(organizations.slug, slug),
  });

  if (!organization) {
    return null;
  }

  const masters = await db.query.events.findMany({
    where: and(
      eq(events.organizationId, organization.id),
      eq(events.status, "published"),
      isNull(events.canonicalEventId),
    ),
    with: {
      source: true,
      organization: true,
      venue: true,
    },
    orderBy: (eventsTable, { asc }) => [asc(eventsTable.startAt)],
  }) as EventMaster[];

  const window = getDefaultExpansionWindow();
  const occurrences = await expandEventsWithOverrides(masters, window);

  return {
    ...organization,
    events: filterOccurrences(occurrences, window),
  };
}

/** @deprecated Use getOrganizerBySlug */
export const getOrganizationBySlug = getOrganizerBySlug;

export async function getVenueBySlug(slug: string) {
  const venue = await db.query.venues.findFirst({
    where: eq(venues.slug, slug),
  });

  if (!venue) {
    return null;
  }

  const masters = await fetchMastersForVenue(venue.id, {
    includeCancelled: false,
  });

  const window = getDefaultExpansionWindow();
  const occurrences = await expandEventsWithOverrides(masters, window);

  return {
    ...venue,
    events: filterOccurrences(
      filterOccurrencesForVenue(occurrences, venue.id),
      window,
    ),
  };
}

export async function getEventsForExport(options?: {
  organizationSlug?: string;
  venueSlug?: string;
}) {
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

export async function listOrganizers() {
  return db.query.organizations.findMany({
    where: eq(organizations.isActive, true),
    orderBy: (table, { asc }) => [asc(table.name)],
  });
}

/** @deprecated Use listOrganizers */
export const listOrganizations = listOrganizers;

export async function listVenues() {
  return db.query.venues.findMany({
    orderBy: (table, { asc }) => [asc(table.name)],
  });
}

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
