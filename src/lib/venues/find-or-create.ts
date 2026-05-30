import { eq } from "drizzle-orm";

import { db } from "@/db";
import { venues } from "@/db/schema";
import { parseIcalLocation, venueSlugFromLocation } from "@/lib/venues/parse-location";

export async function findOrCreateVenue(location: string) {
  const parsed = parseIcalLocation(location);
  const slug = venueSlugFromLocation(location);

  const existing = await db.query.venues.findFirst({
    where: eq(venues.slug, slug),
  });

  if (existing) {
    if (!existing.address && parsed.address) {
      await db
        .update(venues)
        .set({ address: parsed.address })
        .where(eq(venues.id, existing.id));

      return { ...existing, address: parsed.address };
    }

    return existing;
  }

  const [created] = await db
    .insert(venues)
    .values({
      slug,
      name: parsed.name,
      address: parsed.address,
    })
    .returning();

  return created;
}
