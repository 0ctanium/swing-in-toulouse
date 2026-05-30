import { Badge } from "@/components/ui/badge";
import type { VenueCategory } from "@/db/schema";
import { formatVenueCategory } from "@/lib/venues/categories";
import { cn } from "@/lib/utils";

type VenueCategoryBadgeProps = {
  category: VenueCategory | null | undefined;
  className?: string;
};

export function VenueCategoryBadge({
  category,
  className,
}: VenueCategoryBadgeProps) {
  const label = formatVenueCategory(category);

  if (!label) {
    return null;
  }

  return (
    <Badge variant="secondary" className={cn(className)}>
      {label}
    </Badge>
  );
}
