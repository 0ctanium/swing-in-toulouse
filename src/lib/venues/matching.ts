import { and, eq, inArray, isNotNull, isNull, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  eventOverrides,
  events,
  venues,
  type VenueCategory,
  type VenueLocationKind,
} from "@/db/schema";
import { upsertEventOverride } from "@/lib/events/overrides";
import {
  applyPermanentVenueAliases,
  clearVenueAlias,
  listVenueRedirects,
  loadVenueCanonicalMap,
  resolveCanonicalVenueId,
  VenueCanonicalError,
  type VenueRedirectEntry,
} from "@/lib/venues/canonical";
import {
  computeEffectiveVenueEventCounts,
  effectiveVenueIdForEvent,
  loadMasterVenueOverrides,
} from "@/lib/venues/effective-venue";
import { enrichAdminVenueRow } from "@/lib/venues/admin-venue-row";
import {
  buildVenueConfirmPageData,
  isVenueAddressConfirmed,
  venueNeedsAddressConfirmation,
  type VenueConfirmationEntry,
} from "@/lib/venues/confirmation";
import {
  explainVenuePairMatch,
  formatVenuePairMatchReasons,
  venuesMatchForGrouping,
  type DuplicateReason,
} from "@/lib/venues/duplicate-candidates";
import {
  isVenuePairDismissed,
  loadDismissedVenuePairKeys,
} from "@/lib/venues/merge-dismissals";
import {
  summarizeDebug,
  venueMatchingLog,
  type VenueAssignmentDebug,
  type VenueAssignmentEventTrace,
} from "@/lib/venues/matching-debug";
import { namesSimilar, normalizeLabel } from "@/lib/venues/normalize";

export class VenueMatchingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VenueMatchingError";
  }
}

export type VenueWithStats = {
  id: string;
  slug: string;
  name: string;
  address: string | null;
  city: string;
  latitude: number | null;
  longitude: number | null;
  googlePlaceId: string | null;
  formattedAddress: string | null;
  addressConfirmedAt: Date | null;
  canonicalVenueId: string | null;
  canonicalVenueName: string | null;
  category: VenueCategory | null;
  locationKind: VenueLocationKind;
  aliasCount: number;
  eventCount: number;
  overrideCount: number;
};

import type { VenueAssignment } from "@/lib/venues/assignments";

export type { VenueAssignment } from "@/lib/venues/assignments";

export type LocationVenueConflict = {
  locationKey: string;
  sampleLocationRaw: string;
  variants: Array<{
    venueId: string | null;
    venueName: string | null;
    eventCount: number;
  }>;
};

export type SimilarVenuePairMatch = {
  venueIdA: string;
  venueIdB: string;
  nameA: string;
  nameB: string;
  reasons: DuplicateReason[];
  distanceMeters: number | null;
  reasonLabel: string;
};

export type SimilarVenueGroup = {
  key: string;
  locationKeys: string[];
  venues: VenueWithStats[];
  pairMatches: SimilarVenuePairMatch[];
};

export type BulkVenueAssignFilter = {
  targetVenueId: string;
  assignments?: VenueAssignment[];
  sourceVenueIds?: string[];
  locationKey?: string;
  locationKeys?: string[];
  eventIds?: string[];
};

export type BulkVenueAssignResult = {
  matched: number;
  updated: number;
  skipped: number;
  eventIds: string[];
  aliasesCreated: number;
  debug?: VenueAssignmentDebug;
};

function locationNameKey(locationRaw: string) {
  return normalizeLabel(locationRaw.split(",")[0]?.trim() || locationRaw);
}

export async function listVenuesWithStats(): Promise<VenueWithStats[]> {
  const [venueRows, effectiveCounts, overrideRows] = await Promise.all([
    db.query.venues.findMany({
      orderBy: (table, { asc }) => [asc(table.name)],
    }),
    computeEffectiveVenueEventCounts(),
    db.query.eventOverrides.findMany({
      where: isNull(eventOverrides.occurrenceStartAt),
      columns: { eventId: true, patch: true },
    }),
  ]);

  const overrideCountByVenue = new Map<string, number>();
  for (const row of overrideRows) {
    if (row.patch.venueId === undefined) {
      continue;
    }

    const venueId = row.patch.venueId ?? "none";
    overrideCountByVenue.set(
      venueId,
      (overrideCountByVenue.get(venueId) ?? 0) + 1,
    );
  }

  const aliasCountByCanonical = new Map<string, number>();
  for (const venue of venueRows) {
    if (venue.canonicalVenueId) {
      aliasCountByCanonical.set(
        venue.canonicalVenueId,
        (aliasCountByCanonical.get(venue.canonicalVenueId) ?? 0) + 1,
      );
    }
  }

  const venueNameById = new Map(venueRows.map((venue) => [venue.id, venue.name]));

  return venueRows.map((venue) => ({
    id: venue.id,
    slug: venue.slug,
    name: venue.name,
    address: venue.address,
    city: venue.city,
    latitude: venue.latitude,
    longitude: venue.longitude,
    googlePlaceId: venue.googlePlaceId,
    formattedAddress: venue.formattedAddress,
    addressConfirmedAt: venue.addressConfirmedAt,
    canonicalVenueId: venue.canonicalVenueId,
    canonicalVenueName: venue.canonicalVenueId
      ? (venueNameById.get(venue.canonicalVenueId) ?? null)
      : null,
    category: venue.category,
    locationKind: venue.locationKind,
    aliasCount: aliasCountByCanonical.get(venue.id) ?? 0,
    eventCount: effectiveCounts.get(venue.id) ?? 0,
    overrideCount: overrideCountByVenue.get(venue.id) ?? 0,
  }));
}

function buildSimilarVenuePairMatches(
  groupVenues: VenueWithStats[],
): SimilarVenuePairMatch[] {
  const matches: SimilarVenuePairMatch[] = [];

  for (let index = 0; index < groupVenues.length; index += 1) {
    for (let other = index + 1; other < groupVenues.length; other += 1) {
      const left = groupVenues[index]!;
      const right = groupVenues[other]!;
      const explanation = explainVenuePairMatch(left, right);

      matches.push({
        venueIdA: left.id,
        venueIdB: right.id,
        nameA: left.name,
        nameB: right.name,
        reasons: explanation.reasons,
        distanceMeters: explanation.distanceMeters,
        reasonLabel: `${left.name} ↔ ${right.name} — ${formatVenuePairMatchReasons(explanation)}`,
      });
    }
  }

  return matches;
}

export async function groupSimilarVenues(
  venueList: VenueWithStats[],
): Promise<SimilarVenueGroup[]> {
  const active = venueList.filter((venue) => !venue.canonicalVenueId);

  if (active.length < 2) {
    return [];
  }

  const dismissedPairs = await loadDismissedVenuePairKeys();

  const parent = new Map<string, string>();

  function find(id: string): string {
    const current = parent.get(id) ?? id;
    if (current === id) {
      return id;
    }

    const root = find(current);
    parent.set(id, root);
    return root;
  }

  function union(aId: string, bId: string) {
    const rootA = find(aId);
    const rootB = find(bId);
    if (rootA !== rootB) {
      parent.set(rootB, rootA);
    }
  }

  for (const venue of active) {
    parent.set(venue.id, venue.id);
  }

  for (let index = 0; index < active.length; index += 1) {
    for (let other = index + 1; other < active.length; other += 1) {
      const left = active[index]!;
      const right = active[other]!;

      if (isVenuePairDismissed(dismissedPairs, left.id, right.id)) {
        continue;
      }

      if (venuesMatchForGrouping(left, right)) {
        union(left.id, right.id);
      }
    }
  }

  const grouped = new Map<string, VenueWithStats[]>();

  for (const venue of active) {
    const root = find(venue.id);
    const bucket = grouped.get(root) ?? [];
    bucket.push(venue);
    grouped.set(root, bucket);
  }

  return [...grouped.values()]
    .filter((group) => group.length > 1)
    .map((groupVenues) => {
      const sorted = [...groupVenues].sort(
        (a, b) => b.eventCount - a.eventCount,
      );
      const primary = sorted[0]!;

      return {
        key: normalizeLabel(primary.name),
        locationKeys: [
          ...new Set(
            sorted.flatMap((item) => [
              normalizeLabel(item.name),
              normalizeLabel(item.formattedAddress ?? item.address ?? ""),
            ]),
          ),
        ].filter((key) => key.length > 0),
        venues: sorted,
        pairMatches: buildSimilarVenuePairMatches(sorted),
      };
    })
    .sort(
      (a, b) =>
        b.venues.reduce((sum, item) => sum + item.eventCount, 0) -
        a.venues.reduce((sum, item) => sum + item.eventCount, 0),
    );
}

export async function findLocationVenueConflicts(): Promise<LocationVenueConflict[]> {
  const rows = await db
    .select({
      locationRaw: events.locationRaw,
      venueId: events.venueId,
      count: sql<number>`count(*)::int`,
    })
    .from(events)
    .where(
      and(isNotNull(events.locationRaw), isNull(events.canonicalEventId)),
    )
    .groupBy(events.locationRaw, events.venueId);

  const canonicalMap = await loadVenueCanonicalMap();

  function rootVenueId(venueId: string | null) {
    if (!venueId) {
      return null;
    }

    return resolveCanonicalVenueId(venueId, canonicalMap);
  }

  const grouped = new Map<
    string,
    {
      sampleLocationRaw: string;
      variants: Map<string | null, number>;
    }
  >();

  for (const row of rows) {
    if (!row.locationRaw) {
      continue;
    }

    const key = locationNameKey(row.locationRaw);
    const bucket = grouped.get(key) ?? {
      sampleLocationRaw: row.locationRaw,
      variants: new Map<string | null, number>(),
    };

    const resolvedVenueId = rootVenueId(row.venueId);
    bucket.variants.set(
      resolvedVenueId,
      (bucket.variants.get(resolvedVenueId) ?? 0) + row.count,
    );
    grouped.set(key, bucket);
  }

  const canonicalIds = [
    ...new Set(
      [...grouped.values()].flatMap((bucket) =>
        [...bucket.variants.keys()].filter((id): id is string => id != null),
      ),
    ),
  ];

  const venueRows =
    canonicalIds.length > 0
      ? await db.query.venues.findMany({
          where: inArray(venues.id, canonicalIds),
          columns: { id: true, name: true },
        })
      : [];

  const venueNames = new Map(venueRows.map((venue) => [venue.id, venue.name]));

  return [...grouped.entries()]
    .filter(([, bucket]) => bucket.variants.size > 1)
    .map(([locationKey, bucket]) => ({
      locationKey,
      sampleLocationRaw: bucket.sampleLocationRaw,
      variants: [...bucket.variants.entries()]
        .map(([venueId, eventCount]) => ({
          venueId,
          venueName: venueId ? (venueNames.get(venueId) ?? null) : null,
          eventCount,
        }))
        .sort((a, b) => b.eventCount - a.eventCount),
    }))
    .sort(
      (a, b) =>
        b.variants.reduce((sum, item) => sum + item.eventCount, 0) -
        a.variants.reduce((sum, item) => sum + item.eventCount, 0),
    );
}

async function resolveTargetVenue(targetVenueId: string) {
  const venue = await db.query.venues.findFirst({
    where: eq(venues.id, targetVenueId),
  });

  if (!venue) {
    throw new VenueMatchingError("Lieu cible introuvable.");
  }

  if (venue.canonicalVenueId) {
    throw new VenueMatchingError(
      "Le lieu cible est un alias. Choisissez le lieu principal.",
    );
  }

  return venue;
}

function resolveSourceVenueIds(filter: BulkVenueAssignFilter) {
  if (filter.assignments?.length) {
    return filter.assignments.map((assignment) => assignment.sourceVenueId);
  }

  return filter.sourceVenueIds ?? [];
}

function permanentSourceVenueIds(filter: BulkVenueAssignFilter) {
  if (filter.assignments?.length) {
    return filter.assignments
      .filter((assignment) => assignment.permanent !== false)
      .map((assignment) => assignment.sourceVenueId);
  }

  return [];
}

export async function findEventsForVenueAssignment(
  filter: Omit<BulkVenueAssignFilter, "targetVenueId"> & {
    targetVenueId?: string;
    debug?: boolean;
  },
): Promise<{
  events: Array<{ id: string; venueId: string | null }>;
  debug?: VenueAssignmentDebug;
}> {
  const sourceVenueIds =
    filter.assignments?.map((assignment) => assignment.sourceVenueId) ??
    filter.sourceVenueIds;

  let candidates = await db.query.events.findMany({
    where: isNull(events.canonicalEventId),
    columns: {
      id: true,
      venueId: true,
      locationRaw: true,
    },
  });

  const totalNonCanonical = candidates.length;

  if (filter.eventIds?.length) {
    const eventIdSet = new Set(filter.eventIds);
    candidates = candidates.filter((row) => eventIdSet.has(row.id));
  }

  const afterEventIdFilter = candidates.length;

  const overrides = await loadMasterVenueOverrides(
    candidates.map((row) => row.id),
  );
  const canonicalMap = await loadVenueCanonicalMap();

  function effectiveVenueId(row: (typeof candidates)[number]) {
    return effectiveVenueIdForEvent(row, overrides, canonicalMap);
  }

  const locationKeys = [
    ...(filter.locationKeys ?? []),
    ...(filter.locationKey ? [filter.locationKey] : []),
  ];

  const hasSourceFilter =
    Boolean(sourceVenueIds?.length) || locationKeys.length > 0;

  const sampleTraces: VenueAssignmentEventTrace[] = [];
  let excludedNoSourceMatch = 0;
  let excludedAlreadyAtTarget = 0;

  if (hasSourceFilter) {
    candidates = candidates.filter((row) => {
      const effective = effectiveVenueId(row);
      const overrideVenueId = overrides.get(row.id);
      const rowLocationKey = row.locationRaw
        ? locationNameKey(row.locationRaw)
        : null;

      const matchesSourceVenue = Boolean(
        sourceVenueIds?.length &&
          effective &&
          sourceVenueIds.includes(effective),
      );

      const matchesLocation =
        Boolean(row.locationRaw) &&
        locationKeys.some((key) => {
          const rowKey = locationNameKey(row.locationRaw!);
          return rowKey === key || namesSimilar(rowKey, key);
        });

      const passesSource = matchesSourceVenue || matchesLocation;

      if (filter.debug && sampleTraces.length < 40) {
        sampleTraces.push({
          eventId: row.id,
          syncedVenueId: row.venueId,
          overrideVenueId,
          effectiveVenueId: effective,
          locationRaw: row.locationRaw,
          locationKey: rowLocationKey,
          matchedSourceVenue: matchesSourceVenue,
          matchedLocation: matchesLocation,
          included: passesSource,
          excludedReason: passesSource ? null : "no_source_or_location_match",
        });
      }

      if (!passesSource) {
        excludedNoSourceMatch += 1;
      }

      return passesSource;
    });
  }

  const afterSourceFilter = candidates.length;

  if (filter.targetVenueId) {
    const beforeTarget = candidates.length;
    candidates = candidates.filter((row) => {
      const effective = effectiveVenueId(row);
      const alreadyAtTarget = effective === filter.targetVenueId;

      if (alreadyAtTarget) {
        excludedAlreadyAtTarget += 1;

        if (filter.debug) {
          const existing = sampleTraces.find((trace) => trace.eventId === row.id);
          if (existing) {
            existing.included = false;
            existing.excludedReason = "already_at_target";
          } else if (sampleTraces.length < 40) {
            sampleTraces.push({
              eventId: row.id,
              syncedVenueId: row.venueId,
              overrideVenueId: overrides.get(row.id),
              effectiveVenueId: effective,
              locationRaw: row.locationRaw,
              locationKey: row.locationRaw
                ? locationNameKey(row.locationRaw)
                : null,
              matchedSourceVenue: false,
              matchedLocation: false,
              included: false,
              excludedReason: "already_at_target",
            });
          }
        }
      }

      return !alreadyAtTarget;
    });

    venueMatchingLog("target filter", {
      before: beforeTarget,
      after: candidates.length,
      excludedAlreadyAtTarget,
    });
  }

  const matchedEventIds = candidates.map((row) => row.id);
  let debug: VenueAssignmentDebug | undefined;

  if (filter.debug) {
    const targetVenue = filter.targetVenueId
      ? await db.query.venues.findFirst({
          where: eq(venues.id, filter.targetVenueId),
          columns: { id: true, name: true, slug: true },
        })
      : null;

    debug = {
      filter: {
        targetVenueId: filter.targetVenueId,
        sourceVenueIds: sourceVenueIds,
        locationKey: filter.locationKey,
        locationKeys: filter.locationKeys,
        eventIds: filter.eventIds,
      },
      targetVenue: targetVenue ?? null,
      locationKeysUsed: locationKeys,
      stages: {
        totalNonCanonical,
        afterEventIdFilter,
        afterSourceFilter,
        excludedNoSourceMatch,
        afterTargetFilter: candidates.length,
        excludedAlreadyAtTarget,
      },
      matchedEventIds,
      sampleTraces,
    };

    venueMatchingLog("findEventsForVenueAssignment", summarizeDebug(debug));
  }

  return {
    events: candidates.map((row) => ({
      id: row.id,
      venueId: row.venueId,
    })),
    debug,
  };
}

export async function bulkAssignVenue(
  filter: BulkVenueAssignFilter & { debug?: boolean },
): Promise<BulkVenueAssignResult> {
  const targetVenue = await resolveTargetVenue(filter.targetVenueId);
  const sourceVenueIds = resolveSourceVenueIds(filter);
  const permanentSourceIds = permanentSourceVenueIds(filter).filter(
    (id) => id !== filter.targetVenueId,
  );

  venueMatchingLog("bulkAssignVenue start", {
    target: { id: targetVenue.id, name: targetVenue.name, slug: targetVenue.slug },
    sourceVenueIds,
    permanentSourceIds,
    locationKey: filter.locationKey,
    locationKeys: filter.locationKeys,
    eventIds: filter.eventIds?.length ?? 0,
    debug: filter.debug ?? false,
  });

  if (
    !filter.eventIds?.length &&
    !sourceVenueIds.length &&
    !filter.locationKey &&
    !filter.locationKeys?.length
  ) {
    throw new VenueMatchingError(
      "Précisez au moins un filtre : lieux sources, clé location ou liste d'événements.",
    );
  }

  if (
    sourceVenueIds.includes(filter.targetVenueId) &&
    !filter.locationKey &&
    !filter.locationKeys?.length &&
    !filter.eventIds?.length
  ) {
    throw new VenueMatchingError(
      "Le lieu cible ne peut pas être la seule source à réassigner.",
    );
  }

  const { events: matchingEvents, debug } = await findEventsForVenueAssignment({
    ...filter,
    sourceVenueIds,
  });
  const eventIds = matchingEvents.map((row) => row.id);

  venueMatchingLog("bulkAssignVenue matched", {
    count: eventIds.length,
    eventIds: eventIds.slice(0, 10),
  });

  let updated = 0;
  for (const eventId of eventIds) {
    await upsertEventOverride({
      eventId,
      patch: { venueId: filter.targetVenueId },
    });
    updated += 1;
    venueMatchingLog("override upserted", { eventId, targetVenueId: filter.targetVenueId });
  }

  let aliasesCreated = 0;
  if (permanentSourceIds.length > 0) {
    try {
      await applyPermanentVenueAliases(filter.targetVenueId, permanentSourceIds);
      aliasesCreated = permanentSourceIds.length;
    } catch (error) {
      if (error instanceof VenueCanonicalError) {
        throw new VenueMatchingError(error.message);
      }

      throw error;
    }
  }

  const result: BulkVenueAssignResult = {
    matched: eventIds.length,
    updated,
    skipped: 0,
    eventIds,
    aliasesCreated,
    debug,
  };

  venueMatchingLog("bulkAssignVenue done", {
    matched: result.matched,
    updated: result.updated,
  });

  return result;
}

export async function removeVenueRedirect(aliasVenueId: string) {
  await clearVenueAlias(aliasVenueId);
}

export async function getVenueMatchingOverview() {
  const [venueList, locationConflicts, redirectRows] = await Promise.all([
    listVenuesWithStats(),
    findLocationVenueConflicts(),
    listVenueRedirects(),
  ]);

  const effectiveCounts = await computeEffectiveVenueEventCounts();
  const venueRedirects: VenueRedirectEntry[] = redirectRows.map((row) => ({
    ...row,
    eventCount: effectiveCounts.get(row.aliasId) ?? 0,
  }));

  const similarGroups = await groupSimilarVenues(
    venueList.filter((venue) => venue.eventCount > 0 && !venue.canonicalVenueId),
  );
  const confirmationEntries: VenueConfirmationEntry[] = venueList.map(
    (venue) => ({
      ...venue,
      needsConfirmation: venueNeedsAddressConfirmation(venue),
    }),
  );
  const pendingConfirmationCount = confirmationEntries.filter(
    (venue) => venue.needsConfirmation,
  ).length;

  venueMatchingLog("overview", {
    venueCount: venueList.length,
    similarGroupCount: similarGroups.length,
    similarGroups: similarGroups.map((group) => ({
      key: group.key,
      locationKeys: group.locationKeys,
      venues: group.venues.map((venue) => ({
        id: venue.id,
        name: venue.name,
        slug: venue.slug,
        eventCount: venue.eventCount,
      })),
    })),
    locationConflictCount: locationConflicts.length,
    pendingConfirmationCount,
  });

  return {
    venues: venueList,
    similarGroups,
    locationConflicts,
    venueRedirects,
    pendingConfirmationCount,
  };
}

export async function getAdminVenuesPageData() {
  const overview = await getVenueMatchingOverview();

  return {
    venues: overview.venues
      .filter((venue) => !venue.canonicalVenueId)
      .map(enrichAdminVenueRow),
    allVenues: overview.venues,
    venueRedirects: overview.venueRedirects,
    similarGroupCount: overview.similarGroups.length,
    locationConflictCount: overview.locationConflicts.length,
    hasMergeWork:
      overview.similarGroups.length > 0 ||
      overview.locationConflicts.length > 0,
    pendingConfirmationCount: overview.pendingConfirmationCount,
  };
}

export async function getVenueMergePageData() {
  const overview = await getVenueMatchingOverview();

  return {
    venues: overview.venues,
    similarGroups: overview.similarGroups,
    locationConflicts: overview.locationConflicts,
  };
}

export async function getVenueConfirmationOverview() {
  const venueList = await listVenuesWithStats();
  const entries: VenueConfirmationEntry[] = venueList.map((venue) => ({
    ...venue,
    needsConfirmation: venueNeedsAddressConfirmation(venue),
  }));

  return buildVenueConfirmPageData(entries);
}
