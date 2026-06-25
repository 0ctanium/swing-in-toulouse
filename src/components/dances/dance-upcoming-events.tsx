import Link from "next/link";

import { EventList } from "@/components/events/event-list";
import {
  agendaCategoryUrl,
  getDanceUpcomingEvents,
  type PublishedDanceTag,
} from "@/lib/event-category-tags/dance-pages";

type DanceUpcomingEventsProps = {
  slug: string;
  tag: Pick<PublishedDanceTag, "name">;
};

export async function DanceUpcomingEvents({
  slug,
  tag,
}: DanceUpcomingEventsProps) {
  const events = await getDanceUpcomingEvents(slug);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 className="font-heading text-2xl font-semibold">
          Prochains événements
        </h2>
        <Link
          href={agendaCategoryUrl(tag.name)}
          className="text-sm font-medium underline"
        >
          Voir dans l&apos;agenda
        </Link>
      </div>
      <EventList
        events={events}
        emptyMessage={`Aucun événement ${tag.name} à venir pour le moment.`}
      />
    </section>
  );
}
