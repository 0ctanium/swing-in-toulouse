import type { Metadata } from "next";
import { Suspense } from "react";

import { EventConfirmQueue } from "@/components/admin/event-confirm-queue";
import { Skeleton } from "@/components/ui/skeleton";
import {
  getEventConfirmQueue,
  getEventConfirmQueueStats,
} from "@/lib/events/confirm-queue";
import { listOrganizers, listVenues } from "@/lib/events/queries";
import { toVenueSelectOption } from "@/lib/venues/select-options";
import { adminMetadata } from "@/lib/metadata";
import { requireAdminDataScope } from "@/lib/admin/access";

export const metadata: Metadata = adminMetadata({
  title: "Confirmer les événements",
  description:
    "File d’attente des événements importés à valider avant publication.",
});

function AdminEventsConfirmPageSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-10 w-80" />
      <Skeleton className="h-96 w-full rounded-xl" />
    </div>
  );
}

async function AdminEventsConfirmPageContent() {
  const dataScope = await requireAdminDataScope();

  const [items, stats, organizations, venues] = await Promise.all([
    getEventConfirmQueue(dataScope),
    getEventConfirmQueueStats(dataScope),
    listOrganizers(),
    listVenues(),
  ]);

  const organizationOptions =
    dataScope.mode === "org"
      ? organizations
          .filter((organization) => organization.id === dataScope.organizationId)
          .map((organization) => ({
            id: organization.id,
            name: organization.name,
          }))
      : organizations.map((organization) => ({
          id: organization.id,
          name: organization.name,
        }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-semibold">
          Confirmer les événements
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          Validez chaque événement synchronisé depuis iCal. Seuls les
          événements à venir apparaissent dans cette file. Confirmer sans
          modification suffit si les données iCal sont correctes.
        </p>
      </div>

      <EventConfirmQueue
        initialItems={items}
        organizations={organizationOptions}
        venues={venues.map(toVenueSelectOption)}
        confirmedCount={stats.confirmedCount}
      />
    </div>
  );
}

export default function AdminEventsConfirmPage() {
  return (
    <Suspense fallback={<AdminEventsConfirmPageSkeleton />}>
      <AdminEventsConfirmPageContent />
    </Suspense>
  );
}
