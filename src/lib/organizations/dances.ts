export const organizationDanceValues = [
  "Lindy Hop",
  "Blues",
  "Balboa",
  "West Coast Swing",
  "Rock & Boogie",
] as const;

export type OrganizationDance = (typeof organizationDanceValues)[number];

const organizationDanceSet = new Set<string>(organizationDanceValues);

export function isOrganizationDance(value: string): value is OrganizationDance {
  return organizationDanceSet.has(value);
}

export function organizationDanceOptions() {
  return organizationDanceValues.map((value) => ({
    value,
    label: value,
  }));
}

export function normalizeOrganizationDances(
  dances: string[] | null | undefined,
) {
  if (dances === null) {
    return null;
  }

  if (!dances) {
    return undefined;
  }

  const normalized = dances
    .map((dance) => dance.trim())
    .filter((dance): dance is OrganizationDance => isOrganizationDance(dance));

  return normalized.length > 0 ? normalized : null;
}
