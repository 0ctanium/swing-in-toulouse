import Link from "next/link";

import { EventList } from "@/components/events/event-list";
import type { CollectionPageData } from "@/lib/event-collections/queries";
import { agendaUrlForCollection } from "@/lib/event-collections/urls";

type CollectionUpcomingEventsProps = {
  page: Pick<CollectionPageData, "filters" | "events" | "emptyMessage" | "label">;
};

export function CollectionUpcomingEvents({ page }: CollectionUpcomingEventsProps) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 className="font-heading text-2xl font-semibold">
          Prochains événements
        </h2>
        <Link
          href={agendaUrlForCollection(page.filters)}
          className="text-sm font-medium underline"
        >
          Voir dans l&apos;agenda
        </Link>
      </div>
      <EventList events={page.events} emptyMessage={page.emptyMessage} />
    </section>
  );
}
