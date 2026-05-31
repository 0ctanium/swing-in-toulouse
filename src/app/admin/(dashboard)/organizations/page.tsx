import type { Metadata } from "next";
import { Suspense } from "react";
import { isNull } from "drizzle-orm";

import { OrganizationsAdmin } from "@/components/admin/organizations-admin";
import { Skeleton } from "@/components/ui/skeleton";
import { db } from "@/db";
import { venues } from "@/db/schema";
import { adminMetadata } from "@/lib/metadata";
import { listAdminOrganizations } from "@/lib/organizations/admin";
import { toVenueSelectOption } from "@/lib/venues/select-options";

export const metadata: Metadata = adminMetadata({
  title: "Organisateurs",
  description:
    "Gestion des écoles et associations — création, édition et liaison des lieux.",
});

function AdminOrganizationsPageSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-96 w-full rounded-xl" />
    </div>
  );
}

async function AdminOrganizationsPageContent() {
  const [organizations, venueRows] = await Promise.all([
    listAdminOrganizations(),
    db.query.venues.findMany({
      where: isNull(venues.canonicalVenueId),
      orderBy: (table, { asc }) => [asc(table.name)],
    }),
  ]);

  const venueOptions = venueRows.map(toVenueSelectOption);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-semibold">Organisateurs</h1>
        <p className="text-muted-foreground max-w-2xl">
          Gérez les écoles et associations : catégories, site web, lieu lié et
          statut actif.
        </p>
      </div>

      <OrganizationsAdmin
        organizations={organizations}
        venues={venueOptions}
      />
    </div>
  );
}

export default function AdminOrganizationsPage() {
  return (
    <Suspense fallback={<AdminOrganizationsPageSkeleton />}>
      <AdminOrganizationsPageContent />
    </Suspense>
  );
}
