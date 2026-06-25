import Link from "next/link";

import { EventList } from "@/components/events/event-list";
import { getVenueUpcomingEvents } from "@/lib/events/queries";

type VenueUpcomingEventsProps = {
  slug: string;
};

export async function VenueUpcomingEvents({ slug }: VenueUpcomingEventsProps) {
  const events = await getVenueUpcomingEvents(slug);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 className="font-heading text-2xl font-semibold">
          Prochains événements
        </h2>
        <Link href="/lieux" className="text-sm font-medium underline">
          Tous les lieux
        </Link>
      </div>
      <EventList
        events={events}
        emptyMessage="Aucun événement à venir dans ce lieu."
      />
    </section>
  );
}
