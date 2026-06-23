import { describe, expect, it } from "vitest";

import {
  getVenueDisplayAddress,
  getVenueMapsUrl,
  venueShowsPreciseMap,
} from "@/lib/venues/display";

describe("getVenueDisplayAddress", () => {
  it("returns the confirmed formatted address for precise venues", () => {
    expect(
      getVenueDisplayAddress({
        locationKind: "place",
        formattedAddress: "12 rue du Swing, Toulouse",
        address: null,
        city: "Toulouse",
        addressConfirmedAt: new Date(),
        latitude: 43.6,
        longitude: 1.44,
      }),
    ).toBe("12 rue du Swing, Toulouse");
  });

  it("joins address and city when city is not already included", () => {
    expect(
      getVenueDisplayAddress({
        locationKind: "place",
        formattedAddress: null,
        address: "12 rue du Swing",
        city: "Toulouse",
        addressConfirmedAt: null,
        latitude: null,
        longitude: null,
      }),
    ).toBe("12 rue du Swing, Toulouse");
  });

  it("returns the venue name for area locations", () => {
    expect(
      getVenueDisplayAddress({
        locationKind: "area",
        name: "Centre-ville",
        formattedAddress: null,
        address: null,
        city: "Toulouse",
        addressConfirmedAt: null,
        latitude: null,
        longitude: null,
      }),
    ).toBe("Centre-ville");
  });
});

describe("venueShowsPreciseMap", () => {
  it("returns true only for confirmed precise venues", () => {
    expect(
      venueShowsPreciseMap({
        locationKind: "place",
        addressConfirmedAt: new Date(),
        latitude: 43.6,
        longitude: 1.44,
      }),
    ).toBe(true);

    expect(
      venueShowsPreciseMap({
        locationKind: "none",
        addressConfirmedAt: new Date(),
        latitude: 43.6,
        longitude: 1.44,
      }),
    ).toBe(false);
  });
});

describe("getVenueMapsUrl", () => {
  it("builds a Google Maps URL from coordinates", () => {
    expect(
      getVenueMapsUrl({
        name: "Le Grand Bal",
        googlePlaceId: null,
        latitude: 43.6,
        longitude: 1.44,
        formattedAddress: null,
        address: null,
        locationKind: "place",
      }),
    ).toBe("https://www.google.com/maps/search/?api=1&query=43.6,1.44");
  });

  it("returns null for non-precise venue kinds", () => {
    expect(
      getVenueMapsUrl({
        name: "Online",
        googlePlaceId: null,
        latitude: null,
        longitude: null,
        formattedAddress: null,
        address: null,
        locationKind: "none",
      }),
    ).toBeNull();
  });
});
