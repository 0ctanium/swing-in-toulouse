import { describe, expect, it } from "vitest";

import {
  formatIcalStatus,
  formatTransparency,
  getGeoMapsUrl,
  getIcalOrganizer,
  shouldShowIcalOrganizer,
} from "@/lib/events/display";

describe("getGeoMapsUrl", () => {
  it("builds a Google Maps search URL from coordinates", () => {
    expect(getGeoMapsUrl({ lat: 43.6, lon: 1.44 })).toBe(
      "https://www.google.com/maps/search/?api=1&query=43.6,1.44",
    );
  });
});

describe("formatIcalStatus", () => {
  it("maps iCal statuses to French labels", () => {
    expect(formatIcalStatus("TENTATIVE")).toBe("Provisoire");
    expect(formatIcalStatus("CONFIRMED")).toBe("Confirmé");
    expect(formatIcalStatus("CANCELLED")).toBe("Annulé");
    expect(formatIcalStatus(undefined)).toBeUndefined();
  });
});

describe("formatTransparency", () => {
  it("maps transparency values to French labels", () => {
    expect(formatTransparency("TRANSPARENT")).toBe("Disponible");
    expect(formatTransparency("OPAQUE")).toBe("Occupé");
    expect(formatTransparency(undefined)).toBeUndefined();
  });
});

describe("getIcalOrganizer", () => {
  it("returns null when organizer is missing", () => {
    expect(getIcalOrganizer(null)).toBeNull();
    expect(getIcalOrganizer({})).toBeNull();
  });

  it("returns organizer when name or email is present", () => {
    const organizer = { name: "Swing Club", email: "club@example.com" };
    expect(getIcalOrganizer({ organizer })).toEqual(organizer);
  });
});

describe("shouldShowIcalOrganizer", () => {
  it("hides organizer when it matches the organization name without email", () => {
    expect(
      shouldShowIcalOrganizer(
        { organizer: { name: "Swing Club A" } },
        "Swing Club A",
      ),
    ).toBe(false);
  });

  it("shows organizer when email differs from organization branding", () => {
    expect(
      shouldShowIcalOrganizer(
        { organizer: { name: "Swing Club A", email: "other@example.com" } },
        "Swing Club A",
      ),
    ).toBe(true);
  });
});
