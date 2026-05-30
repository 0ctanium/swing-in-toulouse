import { and, eq, inArray, isNull, or } from "drizzle-orm";

import { db } from "@/db";
import { eventOverrides, events } from "@/db/schema";
import type { EventMaster } from "@/db/schema";
import type { EventOccurrence } from "@/lib/ical/recurrence";

export async function loadMasterVenueOverrides(eventIds: string[]) {
  if (eventIds.length === 0) {
    return new Map<string, string | null>();
  }

  const rows = await db.query.eventOverrides.findMany({
    where: and(
      inArray(eventOverrides.eventId, eventIds),
      isNull(eventOverrides.occurrenceStartAt),
    ),
    columns: { eventId: true, patch: true },
  });

  const map = new Map<string, string | null>();
  for (const row of rows) {
    if (row.patch.venueId !== undefined) {
      map.set(row.eventId, row.patch.venueId);
    }
  }

  return map;
}

export function effectiveVenueIdForEvent(
  event: { id: string; venueId: string | null },
  overrides: Map<string, string | null>,
) {
  if (overrides.has(event.id)) {
    return overrides.get(event.id) ?? null;
  }

  return event.venueId;
}

export async function getEventIdsOverriddenToVenue(venueId: string) {
  const rows = await db.query.eventOverrides.findMany({
    where: isNull(eventOverrides.occurrenceStartAt),
    columns: { eventId: true, patch: true },
  });

  return rows
    .filter((row) => row.patch.venueId === venueId)
    .map((row) => row.eventId);
}

export async function fetchMastersForVenue(
  venueId: string,
  options?: { includeCancelled?: boolean },
) {
  const [overriddenEventIds] = await Promise.all([
    getEventIdsOverriddenToVenue(venueId),
  ]);

  const filters = [isNull(events.canonicalEventId)];

  if (!options?.includeCancelled) {
    filters.push(eq(events.status, "published"));
  }

  if (overriddenEventIds.length > 0) {
    filters.push(
      or(eq(events.venueId, venueId), inArray(events.id, overriddenEventIds))!,
    );
  } else {
    filters.push(eq(events.venueId, venueId));
  }

  return db.query.events.findMany({
    where: and(...filters),
    with: {
      source: true,
      organization: true,
      venue: true,
    },
    orderBy: (eventsTable, { asc }) => [asc(eventsTable.startAt)],
  }) as Promise<EventMaster[]>;
}

export function filterOccurrencesForVenue(
  occurrences: EventOccurrence[],
  venueId: string,
) {
  return occurrences.filter((occurrence) => occurrence.venue?.id === venueId);
}

export async function computeEffectiveVenueEventCounts() {
  const [eventRows, overrideRows] = await Promise.all([
    db.query.events.findMany({
      where: isNull(events.canonicalEventId),
      columns: { id: true, venueId: true },
    }),
    db.query.eventOverrides.findMany({
      where: isNull(eventOverrides.occurrenceStartAt),
      columns: { eventId: true, patch: true },
    }),
  ]);

  const overrides = new Map<string, string | null>();
  for (const row of overrideRows) {
    if (row.patch.venueId !== undefined) {
      overrides.set(row.eventId, row.patch.venueId);
    }
  }

  const counts = new Map<string, number>();
  for (const event of eventRows) {
    const effectiveVenueId = effectiveVenueIdForEvent(event, overrides);
    if (!effectiveVenueId) {
      continue;
    }

    counts.set(effectiveVenueId, (counts.get(effectiveVenueId) ?? 0) + 1);
  }

  return counts;
}
