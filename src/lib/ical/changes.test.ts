import { describe, expect, it } from "vitest";

import {
  hasIcalDataChanges,
  hasIcalRevisionChanges,
} from "@/lib/ical/changes";

describe("hasIcalDataChanges", () => {
  it("ignores volatile iCal fields", () => {
    const existing = {
      transparency: "OPAQUE" as const,
      dtstamp: "2026-01-01T00:00:00Z",
    };
    const next = {
      transparency: "OPAQUE" as const,
      dtstamp: "2026-02-01T00:00:00Z",
    };

    expect(hasIcalDataChanges(existing, next)).toBe(false);
  });

  it("detects meaningful field changes", () => {
    expect(
      hasIcalDataChanges(
        { transparency: "OPAQUE" },
        { transparency: "TRANSPARENT" },
      ),
    ).toBe(true);
  });
});

describe("hasIcalRevisionChanges", () => {
  it("detects sequence or last-modified changes", () => {
    const base = {
      sequence: 1,
      lastModified: new Date("2026-01-01T00:00:00Z"),
    };

    expect(
      hasIcalRevisionChanges(base, {
        sequence: 2,
        lastModified: base.lastModified,
      }),
    ).toBe(true);

    expect(
      hasIcalRevisionChanges(base, {
        sequence: 1,
        lastModified: new Date("2026-02-01T00:00:00Z"),
      }),
    ).toBe(true);

    expect(hasIcalRevisionChanges(base, base)).toBe(false);
  });
});
