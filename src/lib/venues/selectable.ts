export function isSelectableVenue(venue: {
  canonicalVenueId: string | null;
}): boolean {
  return venue.canonicalVenueId == null;
}
