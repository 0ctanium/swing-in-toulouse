import { eq } from "drizzle-orm";

import { db } from "@/db";
import { venues } from "@/db/schema";
import { resolveVenueForSync } from "@/lib/venues/canonical";
import { findOrCreateVenue } from "@/lib/venues/find-or-create";

export async function loadOrganizationDisplayVenue(venueId: string | null) {
  if (!venueId) {
    return null;
  }

  const venue = await db.query.venues.findFirst({
    where: eq(venues.id, venueId),
  });

  if (!venue) {
    return null;
  }

  return resolveVenueForSync(venue);
}

export async function resolveOrganizationVenueId(locationRaw: string | null) {
  const trimmed = locationRaw?.trim();

  if (!trimmed) {
    return null;
  }

  const venue = await resolveVenueForSync(await findOrCreateVenue(trimmed));
  return venue.id;
}
