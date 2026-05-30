const LOG_PREFIX = "[venue-matching]";

export function venueMatchingLog(message: string, data?: unknown) {
  if (data !== undefined) {
    console.log(LOG_PREFIX, message, data);
    return;
  }

  console.log(LOG_PREFIX, message);
}

export type VenueAssignmentEventTrace = {
  eventId: string;
  syncedVenueId: string | null;
  overrideVenueId: string | null | undefined;
  effectiveVenueId: string | null;
  locationRaw: string | null;
  locationKey: string | null;
  matchedSourceVenue: boolean;
  matchedLocation: boolean;
  included: boolean;
  excludedReason: string | null;
};

export type VenueAssignmentDebug = {
  filter: Record<string, unknown>;
  targetVenue: { id: string; name: string; slug: string } | null;
  locationKeysUsed: string[];
  stages: {
    totalNonCanonical: number;
    afterEventIdFilter: number;
    afterSourceFilter: number;
    excludedNoSourceMatch: number;
    afterTargetFilter: number;
    excludedAlreadyAtTarget: number;
  };
  matchedEventIds: string[];
  sampleTraces: VenueAssignmentEventTrace[];
};

export function summarizeDebug(debug: VenueAssignmentDebug) {
  return {
    target: debug.targetVenue?.name ?? debug.filter.targetVenueId,
    locationKeysUsed: debug.locationKeysUsed,
    stages: debug.stages,
    matchedCount: debug.matchedEventIds.length,
    matchedEventIds: debug.matchedEventIds.slice(0, 10),
    sampleTraces: debug.sampleTraces.slice(0, 15),
  };
}
