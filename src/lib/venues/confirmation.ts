import type { Venue, VenueLocationKind } from "@/db/schema";
import type { VenueWithStats } from "@/lib/venues/matching";
import { isPreciseVenueLocation } from "@/lib/venues/location-kind";

export type VenueConfirmationEntry = VenueWithStats & {
  latitude: number | null;
  longitude: number | null;
  formattedAddress: string | null;
  addressConfirmedAt: Date | null;
  needsConfirmation: boolean;
};

export function isVenueAddressConfirmed(
  venue: Pick<Venue, "addressConfirmedAt" | "latitude" | "longitude">,
) {
  return (
    venue.addressConfirmedAt != null &&
    venue.latitude != null &&
    venue.longitude != null
  );
}

export function venueNeedsAddressConfirmation(
  venue: Pick<Venue, "addressConfirmedAt" | "latitude" | "longitude"> & {
    eventCount?: number;
    locationKind?: VenueLocationKind;
  },
) {
  if (venue.eventCount === 0) {
    return false;
  }

  if (!isPreciseVenueLocation(venue.locationKind ?? "place")) {
    return false;
  }

  return !isVenueAddressConfirmed(venue);
}

export function splitVenuesForConfirmation(venues: VenueConfirmationEntry[]) {
  const pending = venues
    .filter((venue) => venue.needsConfirmation)
    .sort((a, b) => b.eventCount - a.eventCount);

  const confirmed = venues
    .filter(
      (venue) =>
        isPreciseVenueLocation(venue.locationKind) &&
        isVenueAddressConfirmed(venue),
    )
    .sort((a, b) => b.eventCount - a.eventCount);

  const inactive = venues
    .filter(
      (venue) =>
        venue.eventCount === 0 &&
        (isPreciseVenueLocation(venue.locationKind)
          ? !isVenueAddressConfirmed(venue)
          : false),
    )
    .sort((a, b) => a.name.localeCompare(b.name, "fr"));

  return { pending, confirmed, inactive };
}

export type VenueConfirmPageData = {
  pending: VenueConfirmationEntry[];
  confirmed: VenueConfirmationEntry[];
  inactive: VenueConfirmationEntry[];
  pendingCount: number;
};

export function buildVenueConfirmPageData(
  venues: VenueConfirmationEntry[],
): VenueConfirmPageData {
  const { pending, confirmed, inactive } = splitVenuesForConfirmation(venues);

  return {
    pending,
    confirmed,
    inactive,
    pendingCount: pending.length,
  };
}
