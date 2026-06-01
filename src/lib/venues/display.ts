import type { Venue } from "@/db/schema";
import { getGeoMapsUrl } from "@/lib/events/display";

import { isVenueAddressConfirmed } from "./confirmation";
import {
  isPreciseVenueLocation,
  type VenueLocationKind,
} from "./location-kind";

type VenueAddressFields = Pick<
  Venue,
  | "formattedAddress"
  | "address"
  | "city"
  | "addressConfirmedAt"
  | "latitude"
  | "longitude"
> & {
  locationKind?: VenueLocationKind;
  name?: string;
};

type VenueMapsFields = Pick<
  Venue,
  | "name"
  | "googlePlaceId"
  | "latitude"
  | "longitude"
  | "formattedAddress"
  | "address"
>;

export function getVenueDisplayAddress(venue: VenueAddressFields) {
  const kind = venue.locationKind ?? "place";

  if (
    isPreciseVenueLocation(kind) &&
    isVenueAddressConfirmed(venue) &&
    venue.formattedAddress?.trim()
  ) {
    return venue.formattedAddress.trim();
  }

  if (venue.address?.trim()) {
    const parts = [venue.address.trim()];

    if (
      venue.city?.trim() &&
      !venue.address.toLowerCase().includes(venue.city.toLowerCase())
    ) {
      parts.push(venue.city.trim());
    }

    return parts.join(", ");
  }

  if (kind === "area" || kind === "none") {
    return venue.name?.trim() || venue.city?.trim() || null;
  }

  return venue.city?.trim() ?? null;
}

export function venueShowsPreciseMap(
  venue: Pick<Venue, "locationKind" | "addressConfirmedAt" | "latitude" | "longitude">,
) {
  return (
    isPreciseVenueLocation(venue.locationKind ?? "place") &&
    isVenueAddressConfirmed(venue)
  );
}

export function getVenueMapsUrl(
  venue: VenueMapsFields & { locationKind?: VenueLocationKind },
) {
  if (!isPreciseVenueLocation(venue.locationKind ?? "place")) {
    return null;
  }
  if (venue.googlePlaceId) {
    const params = new URLSearchParams({
      api: "1",
      query: venue.name,
      query_place_id: venue.googlePlaceId,
    });

    return `https://www.google.com/maps/search/?${params.toString()}`;
  }

  if (venue.latitude != null && venue.longitude != null) {
    return getGeoMapsUrl({ lat: venue.latitude, lon: venue.longitude });
  }

  const query = venue.formattedAddress?.trim() || venue.address?.trim();
  if (!query) {
    return null;
  }

  const params = new URLSearchParams({
    api: "1",
    query,
  });

  return `https://www.google.com/maps/search/?${params.toString()}`;
}
