import {
  isVenueAddressConfirmed,
  venueNeedsAddressConfirmation,
} from "@/lib/venues/confirmation";
import type { VenueWithStats } from "@/lib/venues/matching";

export type AdminVenueRow = VenueWithStats & {
  needsConfirmation: boolean;
};

export function enrichAdminVenueRow(venue: VenueWithStats): AdminVenueRow {
  return {
    ...venue,
    needsConfirmation: venueNeedsAddressConfirmation(venue),
  };
}

export { isVenueAddressConfirmed };
