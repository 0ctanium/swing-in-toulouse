import { describe, expect, it, vi } from "vitest";

import {
  appendExdatesToRecurrenceRule,
  formatExdateLine,
  hasMaterialOccurrencePatch,
  resolveIcalExportGeo,
  resolveIcalExportLocation,
  resolveIcalExportOrganizer,
  resolveIcalExportUrl,
  resolveIcalStructuredLocation,
} from "@/lib/ical/export-fields";

describe("formatExdateLine", () => {
  it("formats all-day EXDATE lines", () => {
    expect(
      formatExdateLine(new Date("2026-06-15T00:00:00+02:00"), true),
    ).toBe("EXDATE;VALUE=DATE:20260615");
  });

  it("formats timed EXDATE lines with timezone", () => {
    expect(
      formatExdateLine(new Date("2026-06-15T20:00:00+02:00"), false),
    ).toBe("EXDATE;TZID=Europe/Paris:20260615T200000");
  });
});

describe("appendExdatesToRecurrenceRule", () => {
  it("appends EXDATE lines to an existing recurrence rule", () => {
    const result = appendExdatesToRecurrenceRule(
      "RRULE:FREQ=WEEKLY",
      [new Date("2026-06-15T20:00:00+02:00")],
      false,
    );

    expect(result).toContain("RRULE:FREQ=WEEKLY");
    expect(result).toContain("EXDATE;TZID=Europe/Paris:");
  });
});

describe("resolveIcalExportLocation", () => {
  it("combines venue name and address when needed", () => {
    expect(
      resolveIcalExportLocation(
        {
          name: "Le Grand Bal",
          formattedAddress: "12 rue du Swing, Toulouse",
          address: null,
          city: "Toulouse",
          addressConfirmedAt: new Date(),
          latitude: 43.6,
          longitude: 1.44,
          locationKind: "place",
        } as never,
        null,
      ),
    ).toBe("Le Grand Bal - 12 rue du Swing, Toulouse");
  });

  it("falls back to raw location text", () => {
    expect(resolveIcalExportLocation(null, " Salle X ")).toBe("Salle X");
  });
});

describe("resolveIcalStructuredLocation", () => {
  it("returns undefined without geo coordinates", () => {
    expect(resolveIcalStructuredLocation(null, "Salle X", undefined)).toBeUndefined();
  });

  it("builds a structured location from geo and venue name", () => {
    expect(
      resolveIcalStructuredLocation(
        { name: "Le Grand Bal" } as never,
        null,
        { lat: 43.6, lon: 1.44 },
      ),
    ).toEqual({
      title: "Le Grand Bal",
      geo: { lat: 43.6, lon: 1.44 },
    });
  });
});

describe("resolveIcalExportGeo", () => {
  it("prefers confirmed venue coordinates", () => {
    expect(
      resolveIcalExportGeo({
        locationKind: "place",
        addressConfirmedAt: new Date(),
        latitude: 43.6,
        longitude: 1.44,
      } as never),
    ).toEqual({ lat: 43.6, lon: 1.44 });
  });

  it("falls back to iCal geo data", () => {
    expect(
      resolveIcalExportGeo(null, { geo: { lat: 43.1, lon: 1.1 } }),
    ).toEqual({ lat: 43.1, lon: 1.1 });
  });
});

describe("resolveIcalExportOrganizer", () => {
  it("prefers iCal organizer data", () => {
    expect(
      resolveIcalExportOrganizer(
        { name: "Org DB" } as never,
        { organizer: { name: "Org iCal", email: "club@example.com" } },
      ),
    ).toEqual({ name: "Org iCal", email: "club@example.com" });
  });

  it("falls back to organization name", () => {
    expect(resolveIcalExportOrganizer({ name: "Swing Club" } as never, null)).toEqual({
      name: "Swing Club",
    });
  });
});

describe("resolveIcalExportUrl", () => {
  it("prefers event URL over source URL", () => {
    expect(
      resolveIcalExportUrl({
        url: "https://example.com/event",
        sourceUrl: "https://example.com/source",
      }),
    ).toBe("https://example.com/event");
  });
});

describe("hasMaterialOccurrencePatch", () => {
  it("ignores hidden patches", () => {
    expect(hasMaterialOccurrencePatch({ hidden: true, title: "New title" })).toBe(
      false,
    );
  });

  it("detects material field changes", () => {
    expect(hasMaterialOccurrencePatch({ title: "New title" })).toBe(true);
    expect(hasMaterialOccurrencePatch({})).toBe(false);
  });
});
