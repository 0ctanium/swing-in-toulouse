export type VenueAssignment = {
  sourceVenueId: string;
  permanent?: boolean;
};

/** Permanent redirect alias is created unless the admin explicitly opts out. */
export const VENUE_ALIAS_PERMANENT_DEFAULT = true;

export function isPermanentVenueAlias(
  permanentById: Record<string, boolean>,
  sourceVenueId: string,
) {
  return permanentById[sourceVenueId] ?? VENUE_ALIAS_PERMANENT_DEFAULT;
}

export function togglePermanentVenueAlias(
  permanentById: Record<string, boolean>,
  sourceVenueId: string,
): Record<string, boolean> {
  return {
    ...permanentById,
    [sourceVenueId]: !isPermanentVenueAlias(permanentById, sourceVenueId),
  };
}

export function buildVenueAssignments(
  sourceIds: string[],
  targetId: string,
  permanentById: Record<string, boolean>,
): VenueAssignment[] {
  return sourceIds
    .filter((id) => id !== targetId)
    .map((sourceVenueId) => ({
      sourceVenueId,
      permanent: isPermanentVenueAlias(permanentById, sourceVenueId),
    }));
}
