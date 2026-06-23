import { describe, expect, it, vi } from "vitest";

import {
  getDefaultExpansionWindow,
  getDefaultFromDate,
} from "@/lib/ical/recurrence";

describe("getDefaultFromDate", () => {
  it("returns the start of the current day in the site timezone", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-15T22:30:00.000Z"));

    const from = getDefaultFromDate();

    expect(from.toISOString()).toBe("2026-06-15T22:00:00.000Z");

    vi.useRealTimers();
  });
});

describe("getDefaultExpansionWindow", () => {
  it("expands twelve months from the default from date", () => {
    const from = new Date("2026-06-01T00:00:00.000Z");
    const window = getDefaultExpansionWindow(from);

    expect(window.from).toEqual(from);
    expect(window.to.getUTCFullYear()).toBe(2027);
    expect(window.to.getUTCMonth()).toBe(5);
  });
});

describe("isMasterRelevantForExport", () => {
  it("returns true for upcoming non-recurring events", async () => {
    const { isMasterRelevantForExport } = await import("@/lib/ical/recurrence");

    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-10T12:00:00.000Z"));

    expect(
      isMasterRelevantForExport(
        {
          startAt: new Date("2026-06-20T18:00:00.000Z"),
          endAt: new Date("2026-06-20T21:00:00.000Z"),
          recurrenceRule: null,
          status: "published",
        } as never,
        getDefaultFromDate(),
      ),
    ).toBe(true);

    vi.useRealTimers();
  });
});
