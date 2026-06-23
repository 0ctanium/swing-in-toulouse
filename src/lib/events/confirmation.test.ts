import { describe, expect, it } from "vitest";

import {
  hasMaterialEventChanges,
  isEventConfirmed,
  shouldClearEventConfirmation,
} from "@/lib/events/confirmation";

const baseEvent = {
  title: "Soirée Lindy",
  description: "Bal swing",
  startAt: new Date("2026-03-15T20:00:00+01:00"),
  endAt: new Date("2026-03-15T23:00:00+01:00"),
  isAllDay: false,
  locationRaw: "Le Grand Bal",
  sourceUrl: "https://example.com/event",
  venueId: "11111111-1111-4111-8111-111111111111",
  organizationId: "22222222-2222-4222-8222-222222222222",
  recurrenceRule: null,
  status: "published" as const,
  categories: ["lindy"],
  confirmedAt: new Date("2026-01-01T00:00:00Z"),
};

describe("isEventConfirmed", () => {
  it("returns true when confirmedAt is set", () => {
    expect(isEventConfirmed({ confirmedAt: new Date() })).toBe(true);
    expect(isEventConfirmed({ confirmedAt: null })).toBe(false);
  });
});

describe("hasMaterialEventChanges", () => {
  it("returns false for identical reviewed fields", () => {
    expect(hasMaterialEventChanges(baseEvent, { ...baseEvent })).toBe(false);
  });

  it("detects title changes", () => {
    expect(
      hasMaterialEventChanges(baseEvent, {
        ...baseEvent,
        title: "Bal Blues",
      }),
    ).toBe(true);
  });

  it("detects category changes regardless of order in storage", () => {
    expect(
      hasMaterialEventChanges(baseEvent, {
        ...baseEvent,
        categories: ["lindy"],
      }),
    ).toBe(false);
  });
});

describe("shouldClearEventConfirmation", () => {
  it("clears confirmation only when a confirmed event changed materially", () => {
    expect(
      shouldClearEventConfirmation(baseEvent, {
        ...baseEvent,
        title: "Bal Blues",
      }),
    ).toBe(true);

    expect(
      shouldClearEventConfirmation(
        { ...baseEvent, confirmedAt: null },
        { ...baseEvent, title: "Bal Blues" },
      ),
    ).toBe(false);
  });
});
