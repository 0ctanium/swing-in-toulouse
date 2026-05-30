import { inArray } from "drizzle-orm";

import { db } from "@/db";
import { organizations, venues } from "@/db/schema";
import type { EventMaster } from "@/db/schema";
import {
  applyMasterOverride,
  applyOccurrenceOverride,
  loadOverridesForEvents,
  type OverrideIndex,
  type StoredEventOverride,
} from "@/lib/events/overrides";
import {
  expandMasterEventsToOccurrences,
  type EventOccurrence,
  type ExpansionWindow,
} from "@/lib/ical/recurrence";

function collectRelationIds(overrides: OverrideIndex) {
  const organizationIds = new Set<string>();
  const venueIds = new Set<string>();

  const rows: StoredEventOverride[] = [
    ...overrides.master.values(),
    ...[...overrides.occurrences.values()].flatMap((map) => [...map.values()]),
  ];

  for (const row of rows) {
    if (row.patch.organizationId) {
      organizationIds.add(row.patch.organizationId);
    }
    if (row.patch.venueId) {
      venueIds.add(row.patch.venueId);
    }
  }

  return {
    organizationIds: [...organizationIds],
    venueIds: [...venueIds],
  };
}

async function loadRelationMaps(overrides: OverrideIndex) {
  const { organizationIds, venueIds } = collectRelationIds(overrides);

  const [organizationRows, venueRows] = await Promise.all([
    organizationIds.length
      ? db.query.organizations.findMany({
          where: inArray(organizations.id, organizationIds),
        })
      : Promise.resolve([]),
    venueIds.length
      ? db.query.venues.findMany({
          where: inArray(venues.id, venueIds),
        })
      : Promise.resolve([]),
  ]);

  return {
    organizations: new Map(organizationRows.map((row) => [row.id, row])),
    venues: new Map(venueRows.map((row) => [row.id, row])),
  };
}

export async function mergeMastersWithMasterOverrides<T extends EventMaster>(
  masters: T[],
): Promise<T[]> {
  if (masters.length === 0) {
    return [];
  }

  const overrides = await loadOverridesForEvents(masters.map((master) => master.id));
  const relations = await loadRelationMaps(overrides);

  return masters.map((master) => {
    const merged = applyMasterOverride(
      master,
      overrides.master.get(master.id),
      relations,
    );

    if (!("overrides" in master)) {
      return merged as T;
    }

    return { ...merged, overrides: master.overrides } as T;
  });
}

export async function expandEventsWithOverrides(
  masters: EventMaster[],
  window: ExpansionWindow,
): Promise<EventOccurrence[]> {
  if (masters.length === 0) {
    return [];
  }

  const eventIds = masters.map((master) => master.id);
  const overrides = await loadOverridesForEvents(eventIds);
  const relations = await loadRelationMaps(overrides);

  const mergedMasters = masters.map((master) =>
    applyMasterOverride(
      master,
      overrides.master.get(master.id),
      relations,
    ),
  );

  const occurrences = await expandMasterEventsToOccurrences(
    mergedMasters,
    window,
  );

  return occurrences
    .map((occurrence) => {
      const occurrenceOverride = overrides.occurrences
        .get(occurrence.masterEventId)
        ?.get(occurrence.startAt.toISOString());

      return applyOccurrenceOverride(
        occurrence,
        occurrenceOverride,
        relations,
      );
    })
    .filter((occurrence) => !(occurrence as { isHidden?: boolean }).isHidden);
}
