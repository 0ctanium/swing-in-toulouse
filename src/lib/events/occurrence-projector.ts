import { and, eq, inArray, isNull, lt, notInArray, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  eventOccurrences,
  events,
  type EventMaster,
  type NewEventOccurrenceRow,
} from "@/db/schema";
import { expandEventsWithOverrides } from "@/lib/events/expand-with-overrides";
import {
  getProjectionWindow,
  type ProjectionWindow,
} from "@/lib/events/projection-window";
import type { EventOccurrence } from "@/lib/ical/recurrence";
import {
  loadVenueCanonicalMap,
  resolveCanonicalVenueId,
} from "@/lib/venues/canonical";

export function parseSeriesStartAtFromOccurrenceId(occurrenceId: string) {
  const hashIndex = occurrenceId.indexOf("#");

  if (hashIndex === -1) {
    throw new Error(`Invalid occurrence id: ${occurrenceId}`);
  }

  return new Date(occurrenceId.slice(hashIndex + 1));
}

function toOccurrenceRow(
  occurrence: EventOccurrence,
  master: EventMaster,
  canonicalVenueId: string | null,
): NewEventOccurrenceRow {
  return {
    id: occurrence.id,
    masterEventId: occurrence.masterEventId,
    seriesStartAt: parseSeriesStartAtFromOccurrenceId(occurrence.id),
    startAt: occurrence.startAt,
    endAt: occurrence.endAt,
    slug: occurrence.slug,
    title: occurrence.title,
    description: occurrence.description,
    isAllDay: occurrence.isAllDay,
    locationRaw: occurrence.locationRaw,
    sourceUrl: occurrence.sourceUrl,
    url: occurrence.url,
    status: occurrence.status,
    categories: occurrence.categories,
    organizationId: occurrence.organization?.id ?? null,
    venueId: occurrence.venue?.id ?? null,
    canonicalVenueId,
    sourceId: master.sourceId,
    isOverridden: occurrence.isOverridden ?? false,
    materializedAt: new Date(),
  };
}

async function loadMasterForProjection(
  masterEventId: string,
): Promise<EventMaster | null> {
  const event = await db.query.events.findFirst({
    where: eq(events.id, masterEventId),
    with: {
      source: true,
      organization: true,
      venue: true,
    },
  });

  if (!event || event.canonicalEventId) {
    return null;
  }

  return event as EventMaster;
}

async function deleteOccurrencesForMaster(masterEventId: string) {
  await db
    .delete(eventOccurrences)
    .where(eq(eventOccurrences.masterEventId, masterEventId));
}

async function replaceOccurrencesForMaster(
  masterEventId: string,
  rows: NewEventOccurrenceRow[],
) {
  if (rows.length === 0) {
    await deleteOccurrencesForMaster(masterEventId);
    return;
  }

  await db
    .insert(eventOccurrences)
    .values(rows)
    .onConflictDoUpdate({
      target: eventOccurrences.id,
      set: {
        seriesStartAt: sql`excluded.series_start_at`,
        startAt: sql`excluded.start_at`,
        endAt: sql`excluded.end_at`,
        slug: sql`excluded.slug`,
        title: sql`excluded.title`,
        description: sql`excluded.description`,
        isAllDay: sql`excluded.is_all_day`,
        locationRaw: sql`excluded.location_raw`,
        sourceUrl: sql`excluded.source_url`,
        url: sql`excluded.url`,
        status: sql`excluded.status`,
        categories: sql`excluded.categories`,
        organizationId: sql`excluded.organization_id`,
        venueId: sql`excluded.venue_id`,
        canonicalVenueId: sql`excluded.canonical_venue_id`,
        sourceId: sql`excluded.source_id`,
        isOverridden: sql`excluded.is_overridden`,
        materializedAt: sql`excluded.materialized_at`,
      },
    });

  const newIds = rows.map((row) => row.id);

  await db
    .delete(eventOccurrences)
    .where(
      and(
        eq(eventOccurrences.masterEventId, masterEventId),
        notInArray(eventOccurrences.id, newIds),
      ),
    );
}

export async function rebuildOccurrencesForMaster(
  masterEventId: string,
  window: ProjectionWindow = getProjectionWindow(),
) {
  const master = await loadMasterForProjection(masterEventId);

  if (!master || master.status !== "published") {
    await deleteOccurrencesForMaster(masterEventId);
    return 0;
  }

  const [expanded, canonicalMap] = await Promise.all([
    expandEventsWithOverrides([master], window),
    loadVenueCanonicalMap(),
  ]);

  const rows = expanded
    .filter((occurrence) => occurrence.status === "published")
    .map((occurrence) => {
      const venueId = occurrence.venue?.id ?? null;
      const canonicalVenueId = venueId
        ? resolveCanonicalVenueId(venueId, canonicalMap)
        : null;

      return toOccurrenceRow(occurrence, master, canonicalVenueId);
    });

  await replaceOccurrencesForMaster(masterEventId, rows);

  return rows.length;
}

export async function rebuildOccurrencesForMasters(
  masterEventIds: string[],
  window: ProjectionWindow = getProjectionWindow(),
) {
  const uniqueIds = [...new Set(masterEventIds)];

  if (uniqueIds.length === 0) {
    return 0;
  }

  let total = 0;

  for (const masterEventId of uniqueIds) {
    total += await rebuildOccurrencesForMaster(masterEventId, window);
  }

  return total;
}

export async function rebuildOccurrencesForSource(
  sourceId: string,
  window: ProjectionWindow = getProjectionWindow(),
) {
  const masters = await db.query.events.findMany({
    where: and(
      eq(events.sourceId, sourceId),
      isNull(events.canonicalEventId),
    ),
    columns: { id: true },
  });

  return rebuildOccurrencesForMasters(
    masters.map((master) => master.id),
    window,
  );
}

export async function rebuildAllOccurrences(
  window: ProjectionWindow = getProjectionWindow(),
) {
  const masters = await db.query.events.findMany({
    where: and(
      eq(events.status, "published"),
      isNull(events.canonicalEventId),
    ),
    columns: { id: true },
  });

  return rebuildOccurrencesForMasters(
    masters.map((master) => master.id),
    window,
  );
}

export async function pruneProjectedOccurrencesOutsideWindow(
  window: ProjectionWindow = getProjectionWindow(),
) {
  await db
    .delete(eventOccurrences)
    .where(lt(eventOccurrences.startAt, window.from));
}

export async function rebuildOccurrencesForVenueIds(venueIds: string[]) {
  if (venueIds.length === 0) {
    return 0;
  }

  const rows = await db.query.eventOccurrences.findMany({
    where: inArray(eventOccurrences.venueId, venueIds),
    columns: { masterEventId: true },
  });

  const masterIds = [...new Set(rows.map((row) => row.masterEventId))];

  return rebuildOccurrencesForMasters(masterIds);
}
