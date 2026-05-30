export type VenueAssignment = {
  sourceVenueId: string;
  permanent?: boolean;
};

export function buildVenueAssignments(
  sourceIds: string[],
  targetId: string,
  permanentById: Record<string, boolean>,
): VenueAssignment[] {
  return sourceIds
    .filter((id) => id !== targetId)
    .map((sourceVenueId) => ({
      sourceVenueId,
      permanent: permanentById[sourceVenueId] ?? false,
    }));
}
