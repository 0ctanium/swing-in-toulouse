import Link from "next/link";

import { OrganizationCategoryBadge } from "@/components/organizations/organization-category-badge";
import type { Organization } from "@/db/schema";

type VenueOrganizersSectionProps = {
  organizers: Array<Pick<Organization, "id" | "name" | "slug" | "category">>;
};

export function VenueOrganizersSection({
  organizers,
}: VenueOrganizersSectionProps) {
  if (organizers.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 className="font-heading text-2xl font-semibold">
          Organisateurs dans ce lieu
        </h2>
        <Link href="/organisateurs" className="text-sm font-medium underline">
          Tous les organisateurs
        </Link>
      </div>
      <ul className="flex flex-col gap-2">
        {organizers.map((organizer) => (
          <li key={organizer.id}>
            <Link
              href={`/organisateur/${organizer.slug}`}
              className="inline-flex items-center gap-2 hover:underline"
            >
              <span className="font-medium">{organizer.name}</span>
              <OrganizationCategoryBadge category={organizer.category} />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
