import Link from "next/link";

import { OrganizationCategoryBadge } from "@/components/organizations/organization-category-badge";
import { OrganizationDanceBadges } from "@/components/organizations/organization-dance-badges";
import type { Organization } from "@/db/schema";

type OrganizersIndexProps = {
  organizers: Array<
    Pick<
      Organization,
      "id" | "name" | "slug" | "description" | "category" | "dances"
    >
  >;
};

export function OrganizersIndex({ organizers }: OrganizersIndexProps) {
  if (organizers.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Aucun organisateur pour le moment.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {organizers.map((organizer) => (
        <li key={organizer.id}>
          <article className="bg-card text-card-foreground rounded-xl border p-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold">
                <Link
                  href={`/organisateur/${organizer.slug}`}
                  className="hover:underline"
                >
                  {organizer.name}
                </Link>
              </h2>
              <OrganizationCategoryBadge category={organizer.category} />
            </div>
            <OrganizationDanceBadges dances={organizer.dances} />
            {organizer.description ? (
              <p className="text-muted-foreground mt-2 line-clamp-2 text-sm">
                {organizer.description}
              </p>
            ) : null}
          </article>
        </li>
      ))}
    </ul>
  );
}
