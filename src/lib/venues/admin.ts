import { and, eq, ne } from "drizzle-orm";

import { db } from "@/db";
import { venues } from "@/db/schema";
import {
  enrichAdminVenueRow,
  type AdminVenueRow,
} from "@/lib/venues/admin-venue-row";
import { listVenuesWithStats } from "@/lib/venues/matching";

export type { AdminVenueRow } from "@/lib/venues/admin-venue-row";
export { enrichAdminVenueRow, isVenueAddressConfirmed } from "@/lib/venues/admin-venue-row";

export async function resolveUniqueVenueSlug(
  baseSlug: string,
  excludeId?: string,
) {
  let candidate = baseSlug;
  let suffix = 2;

  while (true) {
    const existing = await db.query.venues.findFirst({
      where: excludeId
        ? and(eq(venues.slug, candidate), ne(venues.id, excludeId))
        : eq(venues.slug, candidate),
      columns: { id: true },
    });

    if (!existing) {
      return candidate;
    }

    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}

export async function listAdminVenues(): Promise<AdminVenueRow[]> {
  const venues = await listVenuesWithStats();
  return venues
    .filter((venue) => !venue.canonicalVenueId)
    .map(enrichAdminVenueRow);
}
