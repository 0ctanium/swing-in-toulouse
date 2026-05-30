import { Badge } from "@/components/ui/badge";
import {
  venueIssueLabel,
  type VenueQualityIssue,
} from "@/lib/venues/parse-location";

type VenueIcalQualityBadgeProps = {
  issues: VenueQualityIssue[];
  showDetails?: boolean;
};

export function VenueIcalQualityBadge({
  issues,
  showDetails = true,
}: VenueIcalQualityBadgeProps) {
  if (issues.length === 0) {
    return null;
  }

  const details = issues.map(venueIssueLabel).join(" · ");

  return (
    <div className="flex flex-col gap-1">
      <Badge
        variant="outline"
        title={details}
        className="w-fit border-amber-500/40 bg-amber-500/10 text-amber-950 dark:text-amber-100"
      >
        Nom iCal douteux
      </Badge>
      {showDetails ? (
        <p className="text-xs text-amber-900/80 dark:text-amber-100/80">
          {details}
        </p>
      ) : null}
    </div>
  );
}
