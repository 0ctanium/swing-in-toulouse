import { and, eq, inArray, isNull, or } from "drizzle-orm";

import { db } from "@/db";
import { eventOverrides, events, venues } from "@/db/schema";
import type { EventMaster } from "@/db/schema";
import type { EventOccurrence } from "@/lib/ical/recurrence";
import {
  loadVenueCanonicalMap,
  resolveCanonicalVenueId,
} from "@/lib/venues/canonical";

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
  canonicalMap?: ReturnType<typeof import("@/lib/venues/canonical").buildVenueCanonicalMap>,
) {
  let venueId: string | null;

  if (overrides.has(event.id)) {
    venueId = overrides.get(event.id) ?? null;
  } else {
    venueId = event.venueId;
  }

  if (!venueId) {
    return null;
  }

  if (canonicalMap) {
    return resolveCanonicalVenueId(venueId, canonicalMap);
  }

  return venueId;
}

export async function getEventIdsOverriddenToVenue(venueId: string) {
  const [rows, canonicalMap] = await Promise.all([
    db.query.eventOverrides.findMany({
      columns: { eventId: true, patch: true },
    }),
    loadVenueCanonicalMap(),
  ]);

  const eventIds = new Set<string>();
  for (const row of rows) {
    const overrideVenueId = row.patch.venueId;
    if (overrideVenueId == null) {
      continue;
    }

    if (resolveCanonicalVenueId(overrideVenueId, canonicalMap) === venueId) {
      eventIds.add(row.eventId);
    }
  }

  return [...eventIds];
}

export async function fetchMastersForVenue(
  venueId: string,
  options?: { includeCancelled?: boolean },
) {
  const aliasRows = await db.query.venues.findMany({
    where: eq(venues.canonicalVenueId, venueId),
    columns: { id: true },
  });
  const syncedVenueIds = [venueId, ...aliasRows.map((row) => row.id)];

  const [overriddenEventIds] = await Promise.all([
    getEventIdsOverriddenToVenue(venueId),
  ]);

  const filters = [isNull(events.canonicalEventId)];

  if (!options?.includeCancelled) {
    filters.push(eq(events.status, "published"));
  }

  if (overriddenEventIds.length > 0) {
    filters.push(
      or(
        inArray(events.venueId, syncedVenueIds),
        inArray(events.id, overriddenEventIds),
      )!,
    );
  } else {
    filters.push(inArray(events.venueId, syncedVenueIds));
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

export async function filterOccurrencesForVenue(
  occurrences: EventOccurrence[],
  venueId: string,
) {
  const canonicalMap = await loadVenueCanonicalMap();

  return occurrences.filter((occurrence) => {
    const occurrenceVenueId = occurrence.venue?.id;
    if (!occurrenceVenueId) {
      return false;
    }

    return (
      resolveCanonicalVenueId(occurrenceVenueId, canonicalMap) === venueId
    );
  });
}

export async function computeEffectiveVenueEventCounts() {
  const [eventRows, overrideRows, canonicalMap] = await Promise.all([
    db.query.events.findMany({
      where: isNull(events.canonicalEventId),
      columns: { id: true, venueId: true },
    }),
    db.query.eventOverrides.findMany({
      where: isNull(eventOverrides.occurrenceStartAt),
      columns: { eventId: true, patch: true },
    }),
    loadVenueCanonicalMap(),
  ]);

  const overrides = new Map<string, string | null>();
  for (const row of overrideRows) {
    if (row.patch.venueId !== undefined) {
      overrides.set(row.eventId, row.patch.venueId);
    }
  }

  const counts = new Map<string, number>();
  for (const event of eventRows) {
    const effectiveVenueId = effectiveVenueIdForEvent(
      event,
      overrides,
      canonicalMap,
    );
    if (!effectiveVenueId) {
      continue;
    }

    counts.set(effectiveVenueId, (counts.get(effectiveVenueId) ?? 0) + 1);
  }

  return counts;
}
