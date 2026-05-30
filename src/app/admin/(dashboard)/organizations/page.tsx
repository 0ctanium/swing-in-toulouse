import type { Metadata } from "next";
import { asc, isNull } from "drizzle-orm";

import { OrganizationSettingsForm } from "@/components/admin/organization-settings-form";
import { db } from "@/db";
import { organizations, venues } from "@/db/schema";
import { adminMetadata } from "@/lib/metadata";
import type { VenueWithStats } from "@/lib/venues/matching";

export const metadata: Metadata = adminMetadata({
  title: "Organisateurs",
  description:
    "Catégories des écoles et associations, liaison des lieux par location_raw.",
});

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

export default async function AdminOrganizationsPage() {
  const [organizationRows, venueRows] = await Promise.all([
    db.query.organizations.findMany({
      orderBy: asc(organizations.name),
      with: {
        venue: true,
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
        <h1 className="font-heading text-3xl font-semibold">Organisateurs</h1>
        <p className="text-muted-foreground max-w-2xl">
          Catégorisez les écoles et associations, et liez un lieu via{" "}
          <code>location_raw</code> (comme pour les sources iCal).
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {organizationRows.map((organization) => (
          <OrganizationSettingsForm
            key={organization.id}
            organization={{
              id: organization.id,
              name: organization.name,
              slug: organization.slug,
              website: organization.website,
              category: organization.category,
              locationRaw: organization.locationRaw,
              venueName: organization.venue?.name ?? null,
              venueSlug: organization.venue?.slug ?? null,
            }}
            venues={venueOptions}
          />
        ))}
      </div>
    </div>
  );
}
