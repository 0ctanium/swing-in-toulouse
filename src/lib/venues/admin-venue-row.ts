import type { VenueQualityIssue } from "@/lib/venues/parse-location";
import {
  isVenueAddressConfirmed,
  venueNeedsAddressConfirmation,
} from "@/lib/venues/confirmation";
import type { VenueWithStats } from "@/lib/venues/matching";
import { getVenueIcalIssues } from "@/lib/venues/quality";

export type AdminVenueRow = VenueWithStats & {
  needsConfirmation: boolean;
  iCalIssues: VenueQualityIssue[];
};

export function enrichAdminVenueRow(venue: VenueWithStats): AdminVenueRow {
  return {
    ...venue,
    needsConfirmation: venueNeedsAddressConfirmation(venue),
    iCalIssues: getVenueIcalIssues(venue),
  };
}

export { isVenueAddressConfirmed };
