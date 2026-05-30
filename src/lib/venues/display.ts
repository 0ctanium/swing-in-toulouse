import type { Venue } from "@/db/schema";
import { getGeoMapsUrl } from "@/lib/events/display";

import { isVenueAddressConfirmed } from "./confirmation";

type VenueAddressFields = Pick<
  Venue,
  | "formattedAddress"
  | "address"
  | "city"
  | "addressConfirmedAt"
  | "latitude"
  | "longitude"
>;

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
  if (isVenueAddressConfirmed(venue) && venue.formattedAddress?.trim()) {
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

  return venue.city?.trim() ?? null;
}

export function getVenueMapsUrl(venue: VenueMapsFields) {
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
