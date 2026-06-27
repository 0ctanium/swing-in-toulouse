import { describe, expect, it } from "vitest";

import type { EventMaster, Organization, Venue } from "@/db/schema";
import {
  applyMasterOverride,
  applyOccurrenceOverride,
  buildOverrideIndex,
  type OccurrenceLike,
  type StoredEventOverride,
} from "@/lib/events/overrides";

const organization: Organization = {
  id: "22222222-2222-4222-8222-222222222222",
  slug: "swing-club",
} as Organization;

const venue: Venue = {
  id: "11111111-1111-4111-8111-111111111111",
  slug: "le-grand-bal",
} as Venue;

const replacementVenue: Venue = {
  id: "33333333-3333-4333-8333-333333333333",
  slug: "le-petit-bal",
} as Venue;

const master = {
  id: "44444444-4444-4444-8444-444444444444",
  title: "Soirée Lindy",
  description: "Bal swing",
  organization,
  venue,
  organizationId: organization.id,
  venueId: venue.id,
} as EventMaster;

function buildOverride(
  patch: StoredEventOverride["patch"],
  occurrenceStartAt: Date | null = null,
): StoredEventOverride {
  return {
    id: "55555555-5555-4555-8555-555555555555",
    eventId: master.id,
    occurrenceStartAt,
    patch,
    notes: null,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
  };
}

describe("buildOverrideIndex", () => {
  it("indexes master and occurrence overrides separately", () => {
    const occurrenceStartAt = new Date("2026-03-15T20:00:00.000Z");
    const masterOverride = buildOverride({ title: "Master title" });
    const occurrenceOverride = buildOverride(
      { hidden: true },
      occurrenceStartAt,
    );

    const index = buildOverrideIndex([masterOverride, occurrenceOverride]);

    expect(index.master.get(master.id)).toEqual(masterOverride);
    expect(index.occurrences.get(master.id)?.get(occurrenceStartAt.toISOString())).toEqual(
      occurrenceOverride,
    );
  });
});

describe("applyMasterOverride", () => {
  it("returns the master unchanged when no override exists", () => {
    expect(
      applyMasterOverride(master, undefined, {
        organizations: new Map(),
        venues: new Map(),
      }),
    ).toBe(master);
  });

  it("merges patch fields and swaps relations when ids change", () => {
    const result = applyMasterOverride(
      master,
      buildOverride({
        title: "Bal Blues",
        venueId: replacementVenue.id,
      }),
      {
        organizations: new Map([[organization.id, organization]]),
        venues: new Map([[replacementVenue.id, replacementVenue]]),
      },
    );

    expect(result.title).toBe("Bal Blues");
    expect(result.venue).toEqual(replacementVenue);
  });
});

describe("applyOccurrenceOverride", () => {
  const occurrenceStartAt = new Date("2026-03-15T20:00:00.000Z");

  it("marks hidden occurrences and applies patch fields", () => {
    const occurrence = {
      masterEventId: master.id,
      startAt: occurrenceStartAt,
      endAt: null,
      title: master.title,
      description: master.description,
      isAllDay: false,
      locationRaw: null,
      sourceUrl: null,
      status: "published" as const,
      categories: ["lindy"],
      offers: null,
      organization,
      venue,
    };

    const result = applyOccurrenceOverride(
      occurrence,
      buildOverride({ hidden: true, title: "Occurrence spéciale" }, occurrenceStartAt),
      {
        organizations: new Map([[organization.id, organization]]),
        venues: new Map([[venue.id, venue]]),
      },
    ) as OccurrenceLike;

    expect(result.title).toBe("Occurrence spéciale");
    expect(result.isHidden).toBe(true);
    expect(result.isOverridden).toBe(true);
  });
});
