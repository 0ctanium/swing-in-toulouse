import { CalendarPlus } from "lucide-react";

import { CalendarSubscribeDialog } from "@/components/calendar/calendar-subscribe-dialog";
import { EventActionLinks } from "@/components/events/event-details";
import { Button } from "@/components/ui/button";
import { emptyIcalPayload } from "@/lib/ical/payload";
import type { EventOccurrence } from "@/lib/events/queries";
import { Suspense } from "react";
import { EventPageAdminSlot } from "./event-page-admin-slot";

type EventPageActionsProps = {
  event: Pick<
    EventOccurrence,
    "id" | "slug" | "title" | "sourceUrl" | "organization"
  >;
};

export function EventPageActions({ event }: EventPageActionsProps) {
  return (
    <div className="flex flex-wrap gap-3 items-stretch">
      <CalendarSubscribeDialog
        payload={{ ...emptyIcalPayload(), event: [event.slug] }}
        feedName={event.title}
        title="Ajouter au calendrier"
        description="Choisissez votre application pour ajouter cet événement."
      >
        <Button
          nativeButton={false}
          render={<a href={`/evenement/${event.slug}.ics`} download />}
        >
          <CalendarPlus data-icon="inline-start" />
          Ajouter au calendrier
        </Button>
      </CalendarSubscribeDialog>
      <EventActionLinks event={event} />
      {event.organization?.website ? (
        <Button
          variant="outline"
          nativeButton={false}
          render={
            <a
              href={event.organization.website}
              target="_blank"
              rel="noreferrer"
            />
          }
        >
          Site de {event.organization.name}
        </Button>
      ) : null}
      <Suspense fallback={null}>
        <EventPageAdminSlot masterEventId={event.id} />
      </Suspense>
    </div>
  );
}
