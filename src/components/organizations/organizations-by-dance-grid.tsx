"use client";

import { Info } from "lucide-react";

import { OrganizationPreviewPopover } from "@/components/organizations/organization-preview-popover";
import type { OrganizerListItem } from "@/components/organizations/organizations-by-dance";
import type { OrganizationDance } from "@/lib/organizations/dances";
import { organizationUrl } from "@/lib/site";

type DanceGroup = {
  dance: OrganizationDance;
  organizers: OrganizerListItem[];
};

function SchoolRow({ organizer }: { organizer: OrganizerListItem }) {
  return (
    <li>
      <OrganizationPreviewPopover organizer={organizer}>
        <span className="min-w-0 flex-1 text-sm font-medium">{organizer.name}</span>
        <Info className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
      </OrganizationPreviewPopover>
    </li>
  );
}

function DanceGroupCard({
  title,
  organizers,
}: {
  title: string;
  organizers: OrganizerListItem[];
}) {
  return (
    <article className="bg-card text-card-foreground flex flex-col gap-3 rounded-xl border p-4 shadow-sm">
      <h3 className="border-primary text-primary border-l-4 pl-3 text-lg font-semibold">
        {title}
      </h3>
      <ul className="flex flex-col gap-2">
        {organizers.map((organizer) => (
          <SchoolRow key={organizer.id} organizer={organizer} />
        ))}
      </ul>
    </article>
  );
}

type OrganizationsByDanceGridProps = {
  danceGroups: DanceGroup[];
  uncategorized: OrganizerListItem[];
  schools: OrganizerListItem[];
};

export function OrganizationsByDanceGrid({
  danceGroups,
  uncategorized,
  schools,
}: OrganizationsByDanceGridProps) {
  return (
    <section className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-2xl font-semibold">
          Écoles par discipline
        </h2>
        <div
          className="bg-primary/25 mt-3 h-px w-full"
          role="presentation"
          aria-hidden
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {danceGroups.map(({ dance, organizers }) => (
          <DanceGroupCard key={dance} title={dance} organizers={organizers} />
        ))}
        {uncategorized.length > 0 ? (
          <DanceGroupCard title="Autres" organizers={uncategorized} />
        ) : null}
      </div>

      <nav aria-label="Liens vers les écoles" className="sr-only">
        <ul>
          {schools.map((school) => (
            <li key={school.id}>
              <a href={organizationUrl(school.slug)}>{school.name}</a>
            </li>
          ))}
        </ul>
      </nav>
    </section>
  );
}
