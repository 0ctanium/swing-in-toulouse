import { eq } from "drizzle-orm";

import { db } from "@/db";
import { venues } from "@/db/schema";
import { resolveVenueForSync } from "@/lib/venues/canonical";

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
