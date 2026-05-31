import type { Metadata } from "next";
import { Suspense } from "react";
import { asc, isNull } from "drizzle-orm";

import { SourcesAdmin } from "@/components/admin/sources-admin";
import { Skeleton } from "@/components/ui/skeleton";
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

function AdminSourcesPageSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-96 w-full rounded-xl" />
    </div>
  );
}

async function AdminSourcesPageContent() {
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

export default function AdminSourcesPage() {
  return (
    <Suspense fallback={<AdminSourcesPageSkeleton />}>
      <AdminSourcesPageContent />
    </Suspense>
  );
}
