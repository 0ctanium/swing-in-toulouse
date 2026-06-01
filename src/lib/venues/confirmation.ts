import type { Venue } from "@/db/schema";
import type { VenueWithStats } from "@/lib/venues/matching";

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
  },
) {
  if (venue.eventCount === 0) {
    return false;
  }

  return !isVenueAddressConfirmed(venue);
}

export function splitVenuesForConfirmation(venues: VenueConfirmationEntry[]) {
  const pending = venues
    .filter((venue) => venue.needsConfirmation)
    .sort((a, b) => b.eventCount - a.eventCount);

  const confirmed = venues
    .filter((venue) => isVenueAddressConfirmed(venue))
    .sort((a, b) => b.eventCount - a.eventCount);

  const inactive = venues
    .filter(
      (venue) =>
        venue.eventCount === 0 && !isVenueAddressConfirmed(venue),
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
