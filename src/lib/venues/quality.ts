import type { VenueWithStats } from "@/lib/venues/matching";
import {
  assessVenueQuality,
  type VenueQualityIssue,
  venueIssueLabel,
} from "@/lib/venues/parse-location";

export type VenueQualityEntry = VenueWithStats & {
  issues: VenueQualityIssue[];
};

export function findVenuesNeedingReview(venues: VenueWithStats[]) {
  const entries: VenueQualityEntry[] = [];

  for (const venue of venues) {
    const report = assessVenueQuality(venue);
    if (report.incoherent || report.issues.includes("missing_address")) {
      entries.push({
        ...venue,
        issues: report.issues,
      });
    }
  }

  return entries.sort((a, b) => {
    const aIncoherent = a.issues.some((issue) => issue !== "missing_address");
    const bIncoherent = b.issues.some((issue) => issue !== "missing_address");
    if (aIncoherent !== bIncoherent) {
      return aIncoherent ? -1 : 1;
    }

    return b.eventCount - a.eventCount;
  });
}

export { venueIssueLabel };
