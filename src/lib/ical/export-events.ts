import { inArray } from "drizzle-orm";

import { db } from "@/db";
import type { EventMaster, Organization, Venue } from "@/db/schema";
import { organizations, venues } from "@/db/schema";
import {
  applyOccurrenceOverride,
  loadOverridesForEvents,
  type OccurrenceLike,
  type OverrideIndex,
  type StoredEventOverride,
} from "@/lib/events/overrides";

import {
  buildNormalizedEvent,
  hasMaterialOccurrencePatch,
} from "./export-fields";
import type { NormalizedEvent } from "./types";

function buildSyntheticOccurrence(
  master: EventMaster,
  occurrenceStartAt: Date,
): OccurrenceLike {
  const durationMs =
    master.endAt != null
      ? master.endAt.getTime() - master.startAt.getTime()
      : null;
  const endAt =
    durationMs != null
      ? new Date(occurrenceStartAt.getTime() + durationMs)
      : null;

  return {
    masterEventId: master.id,
    startAt: occurrenceStartAt,
    endAt,
    title: master.title,
    description: master.description,
    isAllDay: master.isAllDay,
    locationRaw: master.locationRaw,
    sourceUrl: master.sourceUrl,
    status: master.status,
    categories: master.categories,
    organization: master.organization,
    venue: master.venue,
  };
}

function toExportMaster(
  master: EventMaster,
  occurrence: OccurrenceLike,
): EventMaster {
  return {
    ...master,
    title: occurrence.title,
    description: occurrence.description,
    startAt: occurrence.startAt,
    endAt: occurrence.endAt,
    isAllDay: occurrence.isAllDay,
    locationRaw: occurrence.locationRaw,
    sourceUrl: occurrence.sourceUrl,
    status: occurrence.status,
    categories: occurrence.categories,
    organization: occurrence.organization,
    venue: occurrence.venue,
    recurrenceRule: null,
  };
}

async function loadOccurrenceOverrideRelations(
  occurrenceOverrides: StoredEventOverride[],
) {
  const organizationIds = new Set<string>();
  const venueIds = new Set<string>();

  for (const override of occurrenceOverrides) {
    if (override.patch.organizationId) {
      organizationIds.add(override.patch.organizationId);
    }
    if (override.patch.venueId) {
      venueIds.add(override.patch.venueId);
    }
  }

  const [organizationRows, venueRows] = await Promise.all([
    organizationIds.size
      ? db.query.organizations.findMany({
          where: inArray(organizations.id, [...organizationIds]),
        })
      : Promise.resolve([]),
    venueIds.size
      ? db.query.venues.findMany({
          where: inArray(venues.id, [...venueIds]),
        })
      : Promise.resolve([]),
  ]);

  return {
    organizations: new Map<string, Organization>(
      organizationRows.map((row) => [row.id, row]),
    ),
    venues: new Map<string, Venue>(venueRows.map((row) => [row.id, row])),
  };
}

export async function buildNormalizedEventsForExport(
  masters: EventMaster[],
  overrides: OverrideIndex,
): Promise<NormalizedEvent[]> {
  const occurrenceOverrides = masters.flatMap(
    (master) => [...(overrides.occurrences.get(master.id)?.values() ?? [])],
  );
  const relations = await loadOccurrenceOverrideRelations(occurrenceOverrides);
  const normalized: NormalizedEvent[] = [];

  for (const master of masters) {
    const eventOccurrenceOverrides = [
      ...(overrides.occurrences.get(master.id)?.values() ?? []),
    ];

    if (!master.recurrenceRule) {
      const singleOverride = eventOccurrenceOverrides.find(
        (override) =>
          override.occurrenceStartAt?.getTime() === master.startAt.getTime(),
      );

      if (singleOverride?.patch.hidden) {
        continue;
      }

      if (
        singleOverride &&
        hasMaterialOccurrencePatch(singleOverride.patch)
      ) {
        const occurrence = applyOccurrenceOverride(
          buildSyntheticOccurrence(master, master.startAt),
          singleOverride,
          relations,
        );

        normalized.push(buildNormalizedEvent(toExportMaster(master, occurrence)));
        continue;
      }
    }

    const hiddenExdates = master.recurrenceRule
      ? eventOccurrenceOverrides
          .filter((override) => override.patch.hidden === true)
          .map((override) => override.occurrenceStartAt!)
          .filter(Boolean)
      : [];

    normalized.push(
      buildNormalizedEvent(master, {
        extraExdates: hiddenExdates,
      }),
    );

    if (!master.recurrenceRule) {
      continue;
    }

    for (const override of eventOccurrenceOverrides) {
      if (
        !override.occurrenceStartAt ||
        !hasMaterialOccurrencePatch(override.patch)
      ) {
        continue;
      }

      const occurrence = applyOccurrenceOverride(
        buildSyntheticOccurrence(master, override.occurrenceStartAt),
        override,
        relations,
      );

      normalized.push(
        buildNormalizedEvent(toExportMaster(master, occurrence), {
          recurrenceId: override.occurrenceStartAt,
          includeRecurrenceRule: false,
        }),
      );
    }
  }

  return normalized;
}
