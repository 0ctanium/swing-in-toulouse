import type { Organization } from "@/db/schema";
import {
  isOrganizationDance,
  organizationDanceValues,
  type OrganizationDance,
} from "@/lib/organizations/dances";

import { OrganizationsByDanceGrid } from "@/components/organizations/organizations-by-dance-grid";

export type OrganizerListItem = Pick<
  Organization,
  | "id"
  | "name"
  | "slug"
  | "description"
  | "website"
  | "category"
  | "dances"
  | "socialLinks"
>;

function compareOrganizersByName(
  a: OrganizerListItem,
  b: OrganizerListItem,
) {
  return a.name.localeCompare(b.name, "fr", { sensitivity: "base" });
}

function dedupeOrganizersById(organizers: OrganizerListItem[]) {
  const seen = new Set<string>();

  return organizers.filter((organizer) => {
    if (seen.has(organizer.id)) {
      return false;
    }

    seen.add(organizer.id);
    return true;
  });
}

export function groupOrganizersByDance(organizers: OrganizerListItem[]) {
  const byDance = new Map<OrganizationDance, OrganizerListItem[]>();
  const uncategorized: OrganizerListItem[] = [];

  for (const organizer of organizers) {
    const dances =
      organizer.dances?.filter((dance): dance is OrganizationDance =>
        isOrganizationDance(dance),
      ) ?? [];

    if (dances.length === 0) {
      uncategorized.push(organizer);
      continue;
    }

    for (const dance of dances) {
      const group = byDance.get(dance) ?? [];
      group.push(organizer);
      byDance.set(dance, group);
    }
  }

  for (const [dance, group] of byDance) {
    byDance.set(
      dance,
      dedupeOrganizersById(group).sort(compareOrganizersByName),
    );
  }

  uncategorized.sort(compareOrganizersByName);

  const danceGroups = organizationDanceValues
    .filter((dance) => (byDance.get(dance)?.length ?? 0) > 0)
    .map((dance) => ({
      dance,
      organizers: byDance.get(dance)!,
    }));

  return {
    danceGroups,
    uncategorized: dedupeOrganizersById(uncategorized),
  };
}

type OrganizationsByDanceProps = {
  organizers: OrganizerListItem[];
};

export function OrganizationsByDance({ organizers }: OrganizationsByDanceProps) {
  const schools = organizers
    .filter((organizer) => organizer.category === "school")
    .sort(compareOrganizersByName);

  if (schools.length === 0) {
    return null;
  }

  const { danceGroups, uncategorized } = groupOrganizersByDance(schools);

  return (
    <OrganizationsByDanceGrid
      danceGroups={danceGroups}
      uncategorized={uncategorized}
      schools={schools}
    />
  );
}
