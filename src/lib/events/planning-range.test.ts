import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  PLANNING_EVENTS_LIMIT,
  PLANNING_MONTHS_AHEAD,
  getPlanningRange,
} from "@/lib/events/planning-range";

describe("getPlanningRange", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-15T10:00:00+01:00"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns a six-month window from the start of today in site timezone", () => {
    const range = getPlanningRange();

    expect(range.from.toISOString()).toBe("2026-03-14T23:00:00.000Z");
    expect(range.to.getMonth()).toBe(
      (range.from.getMonth() + PLANNING_MONTHS_AHEAD) % 12,
    );
    expect(range.fromKey).toBe(range.from.toISOString());
    expect(range.toKey).toBe(range.to.toISOString());
  });

  it("exports planning constants", () => {
    expect(PLANNING_EVENTS_LIMIT).toBe(20);
    expect(PLANNING_MONTHS_AHEAD).toBe(6);
  });
});
