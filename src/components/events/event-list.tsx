import { format } from "date-fns";
import { fr } from "date-fns/locale";

import type { EventOccurrence } from "@/lib/events/queries";

import { EventCard } from "./event-card";

type EventListProps = {
  events: EventOccurrence[];
  emptyMessage?: string;
};

export function EventList({
  events,
  emptyMessage = "Aucun événement à venir pour le moment.",
}: EventListProps) {
  if (events.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">{emptyMessage}</p>
    );
  }

  const grouped = events.reduce<Record<string, EventOccurrence[]>>(
    (acc, event) => {
      const key = format(event.startAt, "yyyy-MM-dd");
      acc[key] ??= [];
      acc[key].push(event);
      return acc;
    },
    {},
  );

  return (
    <div className="flex flex-col gap-8">
      {Object.entries(grouped).map(([day, dayEvents]) => (
        <section key={day} className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold capitalize">
            {format(new Date(`${day}T12:00:00`), "EEEE d MMMM", { locale: fr })}
          </h2>
          <div className="flex flex-col gap-4">
            {dayEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
