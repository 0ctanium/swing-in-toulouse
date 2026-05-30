import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { events, organizations, venues } from "@/db/schema";
import {
  expandMasterEventsToOccurrences,
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

    filters.push(eq(events.venueId, venue.id));
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

  const masters = await fetchMasterEvents({
    organizationSlug: options?.organizationSlug,
    venueSlug: options?.venueSlug,
    includeCancelled: options?.includeCancelled,
  });

  const occurrences = await expandMasterEventsToOccurrences(masters, window);

  return filterOccurrences(occurrences, window, options?.limit);
}

export async function getEventBySlug(slug: string) {
  return db.query.events.findFirst({
    where: eq(events.slug, slug),
    with: {
      source: true,
      organization: true,
      venue: true,
    },
  });
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
    ),
    with: {
      source: true,
      organization: true,
      venue: true,
    },
    orderBy: (eventsTable, { asc }) => [asc(eventsTable.startAt)],
  }) as EventMaster[];

  const window = getDefaultExpansionWindow();
  const occurrences = await expandMasterEventsToOccurrences(masters, window);

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

  const masters = await db.query.events.findMany({
    where: and(eq(events.venueId, venue.id), eq(events.status, "published")),
    with: {
      source: true,
      organization: true,
      venue: true,
    },
    orderBy: (eventsTable, { asc }) => [asc(eventsTable.startAt)],
  }) as EventMaster[];

  const window = getDefaultExpansionWindow();
  const occurrences = await expandMasterEventsToOccurrences(masters, window);

  return {
    ...venue,
    events: filterOccurrences(occurrences, window),
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

  return masters.filter((master) => isMasterRelevantForExport(master, from));
}

export async function listOrganizers() {
  return db.query.organizations.findMany({
    where: eq(organizations.isActive, true),
    orderBy: (table, { asc }) => [asc(table.name)],
  });
}

/** @deprecated Use listOrganizers */
export const listOrganizations = listOrganizers;

export type { EventOccurrence };
