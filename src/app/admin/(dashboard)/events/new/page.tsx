import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { EventCreateForm } from "@/components/admin/event-create-form";
import { Skeleton } from "@/components/ui/skeleton";
import { requireAdminDataScope } from "@/lib/admin/access";
import { isOrgScoped } from "@/lib/admin/data-scope";
import {
  listOrganizers,
  listVenueMatchCandidates,
  listVenues,
} from "@/lib/events/queries";
import { adminMetadata } from "@/lib/metadata";
import { toVenueSelectOption } from "@/lib/venues/select-options";

export const metadata: Metadata = adminMetadata({
  title: "Nouvel événement",
  description: "Créer un événement manuellement depuis l'administration.",
});

function AdminEventCreatePageSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-[720px] w-full rounded-xl" />
    </div>
  );
}

async function AdminEventCreatePageContent() {
  const dataScope = await requireAdminDataScope();
  const [organizations, venues, venueMatchCandidates] = await Promise.all([
    listOrganizers(),
    listVenues(),
    listVenueMatchCandidates(),
  ]);

  const scopedOrganizations =
    dataScope.mode === "org"
      ? organizations.filter(
          (organization) => organization.id === dataScope.organizationId,
        )
      : organizations;

  const lockedOrganizationId = isOrgScoped(dataScope)
    ? dataScope.organizationId
    : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link
          href="/admin/events"
          className="text-muted-foreground text-sm hover:underline"
        >
          ← Retour aux événements
        </Link>
        <div>
          <h1 className="font-heading text-3xl font-semibold">
            Nouvel événement
          </h1>
          <p className="text-muted-foreground mt-1 max-w-2xl">
            Créez un événement directement dans l&apos;administration. Il sera
            publié et confirmé dès sa création.
          </p>
        </div>
      </div>

      <EventCreateForm
        organizations={scopedOrganizations.map((organization) => ({
          id: organization.id,
          name: organization.name,
        }))}
        venues={venues.map(toVenueSelectOption)}
        venueMatchCandidates={venueMatchCandidates}
        lockedOrganizationId={lockedOrganizationId}
      />
    </div>
  );
}

export default function AdminEventCreatePage() {
  return (
    <Suspense fallback={<AdminEventCreatePageSkeleton />}>
      <AdminEventCreatePageContent />
    </Suspense>
  );
}
