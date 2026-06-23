import { describe, expect, it } from "vitest";

import {
  buildVenueConfirmPageData,
  isVenueAddressConfirmed,
  splitVenuesForConfirmation,
  venueNeedsAddressConfirmation,
} from "@/lib/venues/confirmation";

function makeVenue(
  overrides: Partial<{
    id: string;
    name: string;
    eventCount: number;
    locationKind: "place" | "area" | "none";
    addressConfirmedAt: Date | null;
    latitude: number | null;
    longitude: number | null;
  }> = {},
) {
  return {
    id: overrides.id ?? "venue-1",
    slug: "venue-1",
    name: overrides.name ?? "Le Grand Bal",
    address: null,
    city: "Toulouse",
    latitude: overrides.latitude ?? null,
    longitude: overrides.longitude ?? null,
    googlePlaceId: null,
    formattedAddress: null,
    addressConfirmedAt: overrides.addressConfirmedAt ?? null,
    canonicalVenueId: null,
    canonicalVenueName: null,
    category: null,
    locationKind: overrides.locationKind ?? "place",
    aliasCount: 0,
    overrideCount: 0,
    eventCount: overrides.eventCount ?? 1,
    needsConfirmation: false,
  };
}

describe("isVenueAddressConfirmed", () => {
  it("requires confirmation timestamp and coordinates", () => {
    expect(
      isVenueAddressConfirmed({
        addressConfirmedAt: new Date(),
        latitude: 43.6,
        longitude: 1.44,
      }),
    ).toBe(true);

    expect(
      isVenueAddressConfirmed({
        addressConfirmedAt: null,
        latitude: 43.6,
        longitude: 1.44,
      }),
    ).toBe(false);
  });
});

describe("venueNeedsAddressConfirmation", () => {
  it("returns false for venues without events or non-precise locations", () => {
    expect(
      venueNeedsAddressConfirmation({
        eventCount: 0,
        locationKind: "place",
        addressConfirmedAt: null,
        latitude: null,
        longitude: null,
      }),
    ).toBe(false);

    expect(
      venueNeedsAddressConfirmation({
        eventCount: 3,
        locationKind: "none",
        addressConfirmedAt: null,
        latitude: null,
        longitude: null,
      }),
    ).toBe(false);
  });

  it("returns true for precise venues with events but no confirmation", () => {
    expect(
      venueNeedsAddressConfirmation({
        eventCount: 2,
        locationKind: "place",
        addressConfirmedAt: null,
        latitude: null,
        longitude: null,
      }),
    ).toBe(true);
  });
});

describe("splitVenuesForConfirmation", () => {
  it("groups venues into pending, confirmed, and inactive buckets", () => {
    const pendingVenue = {
      ...makeVenue({ id: "pending", eventCount: 5 }),
      needsConfirmation: true,
    };
    const confirmedVenue = {
      ...makeVenue({
        id: "confirmed",
        addressConfirmedAt: new Date(),
        latitude: 43.6,
        longitude: 1.44,
      }),
      needsConfirmation: false,
    };
    const inactiveVenue = {
      ...makeVenue({ id: "inactive", eventCount: 0 }),
      needsConfirmation: false,
    };

    const result = splitVenuesForConfirmation([
      pendingVenue,
      confirmedVenue,
      inactiveVenue,
    ]);

    expect(result.pending.map((venue) => venue.id)).toEqual(["pending"]);
    expect(result.confirmed.map((venue) => venue.id)).toEqual(["confirmed"]);
    expect(result.inactive.map((venue) => venue.id)).toEqual(["inactive"]);
  });
});

describe("buildVenueConfirmPageData", () => {
  it("returns counts and grouped venue lists", () => {
    const pendingVenue = {
      ...makeVenue({ id: "pending" }),
      needsConfirmation: true,
    };

    const data = buildVenueConfirmPageData([pendingVenue]);

    expect(data.pendingCount).toBe(1);
    expect(data.pending).toHaveLength(1);
    expect(data.confirmed).toHaveLength(0);
  });
});
