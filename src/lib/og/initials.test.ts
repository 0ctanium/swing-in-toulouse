import { describe, expect, it } from "vitest";

import {
  formatUpcomingEventsCount,
  getInitials,
} from "@/lib/og/initials";

describe("getInitials", () => {
  it("uses the first letters of the first two words", () => {
    expect(getInitials("Swing Club Toulouse")).toBe("SC");
  });

  it("uses the first two characters for single-word names", () => {
    expect(getInitials("Lindy")).toBe("LI");
  });
});

describe("formatUpcomingEventsCount", () => {
  it("formats French upcoming event counts", () => {
    expect(formatUpcomingEventsCount(0)).toBe("Aucun événement à venir");
    expect(formatUpcomingEventsCount(1)).toBe("1 événement à venir");
    expect(formatUpcomingEventsCount(3)).toBe("3 événements à venir");
  });
});
