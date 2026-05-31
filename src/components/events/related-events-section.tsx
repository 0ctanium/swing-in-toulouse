import Link from "next/link";

import { EventList } from "@/components/events/event-list";
import type { EventOccurrence } from "@/lib/events/queries";

type RelatedEventsSectionProps = {
  title: string;
  events: EventOccurrence[];
  indexHref?: string;
  indexLabel?: string;
};

export function RelatedEventsSection({
  title,
  events,
  indexHref,
  indexLabel,
}: RelatedEventsSectionProps) {
  if (events.length === 0 && !indexHref) {
    return null;
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 className="font-heading text-2xl font-semibold">{title}</h2>
        {indexHref && indexLabel ? (
          <Link href={indexHref} className="text-sm font-medium underline">
            {indexLabel}
          </Link>
        ) : null}
      </div>
      {events.length > 0 ? (
        <EventList events={events} emptyMessage="" />
      ) : null}
    </section>
  );
}
