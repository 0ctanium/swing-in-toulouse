import { Badge } from "@/components/ui/badge";
import type { OrganizationCategory } from "@/db/schema";
import { formatOrganizationCategory } from "@/lib/organizations/categories";
import { cn } from "@/lib/utils";

type OrganizationCategoryBadgeProps = {
  category: OrganizationCategory | null | undefined;
  className?: string;
};

export function OrganizationCategoryBadge({
  category,
  className,
}: OrganizationCategoryBadgeProps) {
  const label = formatOrganizationCategory(category);

  if (!label) {
    return null;
  }

  return (
    <Badge variant="secondary" className={cn(className)}>
      {label}
    </Badge>
  );
}
