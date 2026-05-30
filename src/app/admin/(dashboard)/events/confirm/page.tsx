import type { Metadata } from "next";

import { EventConfirmQueue } from "@/components/admin/event-confirm-queue";
import {
  getEventConfirmQueue,
  getEventConfirmQueueStats,
} from "@/lib/events/confirm-queue";
import { listOrganizers, listVenues } from "@/lib/events/queries";
import { toVenueSelectOption } from "@/lib/venues/select-options";
import { adminMetadata } from "@/lib/metadata";

export const metadata: Metadata = adminMetadata({
  title: "Confirmer les événements",
  description:
    "File d’attente des événements importés à valider avant publication.",
});

export const dynamic = "force-dynamic";

export default async function AdminEventsConfirmPage() {
  const [items, stats, organizations, venues] = await Promise.all([
    getEventConfirmQueue(),
    getEventConfirmQueueStats(),
    listOrganizers(),
    listVenues(),
  ]);

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
        organizations={organizations.map((organization) => ({
          id: organization.id,
          name: organization.name,
        }))}
        venues={venues.map(toVenueSelectOption)}
        confirmedCount={stats.confirmedCount}
      />
    </div>
  );
}
