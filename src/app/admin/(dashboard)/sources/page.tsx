import Link from "next/link";
import { asc, isNull } from "drizzle-orm";

import { SourceDefaultsForm } from "@/components/admin/source-defaults-form";
import { db } from "@/db";
import { sources, venues } from "@/db/schema";
import type { VenueWithStats } from "@/lib/venues/matching";

export const dynamic = "force-dynamic";

function toVenuePickerOption(venue: typeof venues.$inferSelect): VenueWithStats {
  return {
    id: venue.id,
    slug: venue.slug,
    name: venue.name,
    address: venue.address,
    city: venue.city,
    latitude: venue.latitude,
    longitude: venue.longitude,
    googlePlaceId: venue.googlePlaceId,
    formattedAddress: venue.formattedAddress,
    addressConfirmedAt: venue.addressConfirmedAt,
    canonicalVenueId: venue.canonicalVenueId,
    canonicalVenueName: null,
    category: venue.category,
    aliasCount: 0,
    eventCount: 0,
    overrideCount: 0,
  };
}

export default async function AdminSourcesPage() {
  const [sourceRows, venueRows] = await Promise.all([
    db.query.sources.findMany({
      orderBy: asc(sources.name),
      with: {
        organization: true,
      },
    }),
    db.query.venues.findMany({
      where: isNull(venues.canonicalVenueId),
      orderBy: asc(venues.name),
    }),
  ]);

  const venueOptions = venueRows.map(toVenuePickerOption);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link href="/admin" className="text-muted-foreground text-sm hover:underline">
          ← Retour aux corrections
        </Link>
        <h1 className="font-heading text-3xl font-semibold">Sources</h1>
        <p className="text-muted-foreground max-w-2xl">
          Définissez un lieu et des catégories par défaut pour chaque flux iCal.
          Ils s&apos;appliquent aux événements sans LOCATION ou CATEGORIES dans
          le calendrier source.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {sourceRows.map((source) => (
          <SourceDefaultsForm
            key={source.id}
            source={{
              id: source.id,
              name: source.name,
              slug: source.slug,
              url: source.url,
              isActive: source.isActive,
              organizationName: source.organization?.name ?? null,
              defaultLocationRaw: source.defaultLocationRaw,
              defaultCategories: source.defaultCategories,
            }}
            venues={venueOptions}
          />
        ))}
      </div>
    </div>
  );
}
