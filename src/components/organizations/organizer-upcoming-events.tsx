import Link from "next/link";

import { EventList } from "@/components/events/event-list";
import { getOrganizerUpcomingEvents } from "@/lib/events/queries";

type OrganizerUpcomingEventsProps = {
  slug: string;
};

export async function OrganizerUpcomingEvents({
  slug,
}: OrganizerUpcomingEventsProps) {
  const events = await getOrganizerUpcomingEvents(slug);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 className="font-heading text-2xl font-semibold">
          Prochains événements
        </h2>
        <Link href="/organisateurs" className="text-sm font-medium underline">
          Tous les organisateurs
        </Link>
      </div>
      <EventList
        events={events}
        emptyMessage="Aucun événement à venir pour cet organisateur."
      />
    </section>
  );
}
