export type VenueMatchCandidate = {
  id: string;
  names: string[];
};

export function buildVenueMatchCandidates(
  venues: ReadonlyArray<{
    id: string;
    name: string;
    canonicalVenueId: string | null;
  }>,
): VenueMatchCandidate[] {
  const namesByCanonicalId = new Map<string, Set<string>>();

  for (const venue of venues) {
    const canonicalId = venue.canonicalVenueId ?? venue.id;
    const names = namesByCanonicalId.get(canonicalId) ?? new Set<string>();
    names.add(venue.name);
    namesByCanonicalId.set(canonicalId, names);
  }

  return [...namesByCanonicalId.entries()].map(([id, names]) => ({
    id,
    names: [...names],
  }));
}

export function buildOrganizationMatchCandidates(
  organizations: ReadonlyArray<{ id: string; name: string }>,
) {
  return organizations.map((organization) => ({
    id: organization.id,
    names: [organization.name],
  }));
}
