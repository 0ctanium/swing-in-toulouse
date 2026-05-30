import Link from "next/link";

import { EventConfirmQueue } from "@/components/admin/event-confirm-queue";
import {
  getEventConfirmQueue,
  getEventConfirmQueueStats,
} from "@/lib/events/confirm-queue";
import { listOrganizers, listVenues } from "@/lib/events/queries";

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
        <Link
          href="/admin"
          className="text-muted-foreground text-sm hover:underline"
        >
          ← Retour aux corrections
        </Link>
        <h1 className="font-heading text-3xl font-semibold">
          Confirmer les événements
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          Validez chaque événement synchronisé depuis iCal. Les événements à
          venir sont traités en premier, les événements passés en dernier.
          Confirmer sans modification suffit si les données iCal sont correctes.
        </p>
      </div>

      <EventConfirmQueue
        initialItems={items}
        organizations={organizations.map((organization) => ({
          id: organization.id,
          name: organization.name,
        }))}
        venues={venues.map((venue) => ({
          id: venue.id,
          name: venue.name,
        }))}
        confirmedCount={stats.confirmedCount}
      />
    </div>
  );
}
