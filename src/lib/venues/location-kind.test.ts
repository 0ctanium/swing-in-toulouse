import { describe, expect, it } from "vitest";

import {
  formatVenueLocationKind,
  googleFieldsForLocationKind,
  inferLocationKindFromIcal,
  isPreciseVenueLocation,
  venueLocationKindOptions,
} from "@/lib/venues/location-kind";

describe("inferLocationKindFromIcal", () => {
  it("detects a precise place from a street address", () => {
    expect(
      inferLocationKindFromIcal(
        "Le Grand Bal, 12 rue des Filatiers, 31000 Toulouse",
      ),
    ).toBe("place");
  });

  it("detects a vague area from a city-only name", () => {
    expect(inferLocationKindFromIcal("Toulouse")).toBe("area");
  });

  it("returns none for empty locations", () => {
    expect(inferLocationKindFromIcal("   ")).toBe("none");
  });

  it("detects a vague area when there is no comma and no digits", () => {
    expect(inferLocationKindFromIcal("Parc de la Reynerie")).toBe("area");
  });
});

describe("venue location kind helpers", () => {
  it("labels each kind in French", () => {
    expect(formatVenueLocationKind("place")).toBe("Lieu précis");
    expect(venueLocationKindOptions()).toHaveLength(3);
  });

  it("treats only place as precise", () => {
    expect(isPreciseVenueLocation("place")).toBe(true);
    expect(isPreciseVenueLocation("area")).toBe(false);
  });

  it("clears Google fields for non-place kinds", () => {
    expect(googleFieldsForLocationKind("place")).toEqual({});
    expect(googleFieldsForLocationKind("area")).toMatchObject({
      latitude: null,
      googlePlaceId: null,
    });
  });
});
