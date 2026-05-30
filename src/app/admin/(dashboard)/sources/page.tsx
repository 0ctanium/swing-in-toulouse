import type { Metadata } from "next";
import { asc, isNull } from "drizzle-orm";

import { SourcesAdmin } from "@/components/admin/sources-admin";
import { db } from "@/db";
import { organizations, venues } from "@/db/schema";
import { adminMetadata } from "@/lib/metadata";
import { listAdminSources } from "@/lib/sources/admin";
import { toVenueSelectOption } from "@/lib/venues/select-options";

export const metadata: Metadata = adminMetadata({
  title: "Sources",
  description:
    "Gestion des flux iCal synchronisés — création, édition et valeurs par défaut.",
});

export const dynamic = "force-dynamic";

export default async function AdminSourcesPage() {
  const [sourceRows, organizationRows, venueRows] = await Promise.all([
    listAdminSources(),
    db.query.organizations.findMany({
      orderBy: asc(organizations.name),
      columns: {
        id: true,
        name: true,
      },
    }),
    db.query.venues.findMany({
      where: isNull(venues.canonicalVenueId),
      orderBy: asc(venues.name),
    }),
  ]);

  const organizationOptions = organizationRows.map((organization) => ({
    id: organization.id,
    name: organization.name,
  }));
  const venueOptions = venueRows.map(toVenueSelectOption);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-semibold">Sources</h1>
        <p className="text-muted-foreground max-w-2xl">
          Gérez les flux iCal : URL, organisateur lié, lieu et catégories par
          défaut pour la synchronisation.
        </p>
      </div>

      <SourcesAdmin
        sources={sourceRows}
        organizations={organizationOptions}
        venues={venueOptions}
      />
    </div>
  );
}
