/**
 * Re-classify existing venues with inferLocationKindFromIcal using name + address.
 * Run: npx tsx scripts/backfill-venue-location-kind.ts
 */
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { venues } from "@/db/schema";
import { inferLocationKindFromIcal } from "@/lib/venues/location-kind";
import { parseIcalLocation } from "@/lib/venues/parse-location";

async function main() {
  const rows = await db.query.venues.findMany({
    where: (table, { isNull }) => isNull(table.canonicalVenueId),
    columns: {
      id: true,
      name: true,
      address: true,
      locationKind: true,
      addressConfirmedAt: true,
    },
  });

  let updated = 0;

  for (const row of rows) {
    if (row.addressConfirmedAt) {
      continue;
    }

    const location = row.address
      ? `${row.name}, ${row.address}`
      : row.name;
    const parsed = parseIcalLocation(location);
    const inferred = inferLocationKindFromIcal(location, parsed);

    if (inferred === row.locationKind) {
      continue;
    }

    await db
      .update(venues)
      .set({ locationKind: inferred })
      .where(eq(venues.id, row.id));

    updated += 1;
    console.log(`${row.name}: ${row.locationKind} → ${inferred}`);
  }

  console.log(`Done. Updated ${updated} venue(s).`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
