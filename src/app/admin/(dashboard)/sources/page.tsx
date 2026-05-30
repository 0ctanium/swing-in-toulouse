import type { Metadata } from "next";
import { asc, isNull } from "drizzle-orm";

import { SourceDefaultsForm } from "@/components/admin/source-defaults-form";
import { db } from "@/db";
import { sources, venues } from "@/db/schema";
import { adminMetadata } from "@/lib/metadata";
import { toVenueSelectOption } from "@/lib/venues/select-options";

export const metadata: Metadata = adminMetadata({
  title: "Sources",
  description:
    "Lieux et catégories par défaut pour chaque flux iCal synchronisé.",
});

export const dynamic = "force-dynamic";

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

  const venueOptions = venueRows.map(toVenueSelectOption);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
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
