import { describe, expect, it } from "vitest";

import {
  filterAgendaOccurrences,
  filterMastersForExport,
  hasActiveAgendaFilters,
} from "@/lib/events/agenda-filters";
import type { EventMaster } from "@/db/schema";
import type { EventOccurrence } from "@/lib/events/queries";

const organization = {
  id: "22222222-2222-4222-8222-222222222222",
  slug: "swing-club",
} as EventMaster["organization"];

const venue = {
  id: "11111111-1111-4111-8111-111111111111",
  slug: "le-grand-bal",
} as EventMaster["venue"];

function buildMaster(overrides: Partial<EventMaster> = {}): EventMaster {
  return {
    categories: ["lindy"],
    organization,
    venue,
    ...overrides,
  } as EventMaster;
}

function buildOccurrence(
  overrides: Partial<EventOccurrence> = {},
): EventOccurrence {
  return {
    categories: ["lindy"],
    organization,
    venue,
    startAt: new Date("2026-03-15T20:00:00+01:00"),
    endAt: null,
    ...overrides,
  } as EventOccurrence;
}

describe("hasActiveAgendaFilters", () => {
  it("detects active filters", () => {
    expect(
      hasActiveAgendaFilters({ category: [], venue: [], org: [] }),
    ).toBe(false);
    expect(
      hasActiveAgendaFilters({ category: ["lindy"], venue: [], org: [] }),
    ).toBe(true);
  });
});

describe("filterMastersForExport", () => {
  const masters = [
    buildMaster(),
    buildMaster({
      categories: ["blues"],
      organization: { ...organization!, slug: "blues-club" },
      venue: { ...venue!, slug: "le-petit-bal" },
    }),
  ];

  it("returns all masters when no filters are active", () => {
    expect(
      filterMastersForExport(masters, { category: [], venue: [], org: [] }),
    ).toHaveLength(2);
  });

  it("filters by category, venue, and organization slug", () => {
    expect(
      filterMastersForExport(masters, {
        category: ["lindy"],
        venue: [],
        org: [],
      }),
    ).toHaveLength(1);

    expect(
      filterMastersForExport(masters, {
        category: [],
        venue: ["le-grand-bal"],
        org: [],
      }),
    ).toHaveLength(1);

    expect(
      filterMastersForExport(masters, {
        category: [],
        venue: [],
        org: ["swing-club"],
      }),
    ).toHaveLength(1);
  });
});

describe("filterAgendaOccurrences", () => {
  const occurrences = [buildOccurrence(), buildOccurrence({ categories: ["blues"] })];

  it("filters occurrences with the same rules as masters", () => {
    expect(
      filterAgendaOccurrences(
        occurrences,
        { category: ["blues"], venue: [], org: [] },
        {},
      ),
    ).toHaveLength(1);
  });
});
