import { Badge } from "@/components/ui/badge";
import type { OrganizationDance } from "@/lib/organizations/dances";

type OrganizationDanceBadgesProps = {
  dances: OrganizationDance[] | null | undefined;
};

export function OrganizationDanceBadges({ dances }: OrganizationDanceBadgesProps) {
  if (!dances?.length) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {dances.map((dance) => (
        <Badge key={dance} variant="outline">
          {dance}
        </Badge>
      ))}
    </div>
  );
}
