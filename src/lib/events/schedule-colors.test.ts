import { describe, expect, it } from "vitest";

import {
  getScheduleEventColor,
  getScheduleEventColorSeed,
} from "@/lib/events/schedule-colors";

describe("getScheduleEventColor", () => {
  it("returns a stable color for the same seed", () => {
    expect(getScheduleEventColor("event-a")).toBe(getScheduleEventColor("event-a"));
  });

  it("returns a hex color string", () => {
    expect(getScheduleEventColor("seed")).toMatch(/^#[0-9a-f]{6}$/i);
  });
});

describe("getScheduleEventColorSeed", () => {
  it("prefers organization id, then source id, then master event id", () => {
    expect(
      getScheduleEventColorSeed({
        organization: { id: "org-1" },
        source: { id: "source-1" },
        masterEventId: "event-1",
      }),
    ).toBe("org-1");

    expect(
      getScheduleEventColorSeed({
        organization: null,
        source: { id: "source-1" },
        masterEventId: "event-1",
      }),
    ).toBe("source-1");

    expect(
      getScheduleEventColorSeed({
        organization: null,
        source: null,
        masterEventId: "event-1",
      }),
    ).toBe("event-1");
  });
});
