import { Badge } from "@/components/ui/badge";
import type { VenueLocationKind } from "@/db/schema";
import { formatVenueLocationKind } from "@/lib/venues/location-kind";

type VenueLocationKindBadgeProps = {
  locationKind: VenueLocationKind;
};

export function VenueLocationKindBadge({
  locationKind,
}: VenueLocationKindBadgeProps) {
  if (locationKind === "place") {
    return null;
  }

  return (
    <Badge variant="outline" className="text-xs font-normal">
      {formatVenueLocationKind(locationKind)}
    </Badge>
  );
}
