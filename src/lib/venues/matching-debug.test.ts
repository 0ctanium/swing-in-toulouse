import { describe, expect, it } from "vitest";

import { summarizeDebug } from "@/lib/venues/matching-debug";

describe("summarizeDebug", () => {
  it("returns a compact summary of venue assignment debug data", () => {
    const summary = summarizeDebug({
      filter: { targetVenueId: "venue-1" },
      targetVenue: { id: "venue-1", name: "Le Grand Bal", slug: "le-grand-bal" },
      locationKeysUsed: ["le grand bal"],
      stages: {
        totalNonCanonical: 10,
        afterEventIdFilter: 8,
        afterSourceFilter: 6,
        excludedNoSourceMatch: 2,
        afterTargetFilter: 4,
        excludedAlreadyAtTarget: 1,
      },
      matchedEventIds: ["e1", "e2", "e3"],
      sampleTraces: Array.from({ length: 20 }, (_, index) => ({
        eventId: `event-${index}`,
        syncedVenueId: null,
        overrideVenueId: null,
        effectiveVenueId: "venue-1",
        locationRaw: "Le Grand Bal",
        locationKey: "le grand bal",
        matchedSourceVenue: true,
        matchedLocation: true,
        included: true,
        excludedReason: null,
      })),
    });

    expect(summary).toEqual({
      target: "Le Grand Bal",
      locationKeysUsed: ["le grand bal"],
      stages: {
        totalNonCanonical: 10,
        afterEventIdFilter: 8,
        afterSourceFilter: 6,
        excludedNoSourceMatch: 2,
        afterTargetFilter: 4,
        excludedAlreadyAtTarget: 1,
      },
      matchedCount: 3,
      matchedEventIds: ["e1", "e2", "e3"],
      sampleTraces: expect.any(Array),
    });
    expect(summary.sampleTraces).toHaveLength(15);
  });
});
