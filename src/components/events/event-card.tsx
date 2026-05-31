import Link from "next/link";

import { AdminEventActions } from "@/components/admin/admin-event-actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  EventActionLinks,
  EventBadges,
  EventDateLine,
  EventDescriptionBlock,
  EventLocationLine,
  EventOrganizerLine,
} from "@/components/events/event-details";
import type { AdminEventMeta } from "@/lib/events/admin-meta";
import type { EventOccurrence } from "@/lib/events/queries";

type EventCardProps = {
  event: EventOccurrence & { admin?: AdminEventMeta };
};

export function EventCard({ event }: EventCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <CardTitle className="text-xl">
            <Link href={`/evenement/${event.slug}`} className="hover:underline">
              {event.title}
            </Link>
          </CardTitle>
        </div>
        <CardDescription className="flex flex-col gap-2">
          <EventDateLine event={event} />
          <EventOrganizerLine event={event} className="text-sm" />
          <EventLocationLine event={event} />
        </CardDescription>
      </CardHeader>
      {event.description ? (
        <CardContent className="pt-0">
          <EventDescriptionBlock
            description={event.description}
            clamp={3}
            className="text-muted-foreground text-sm"
          />
        </CardContent>
      ) : null}
      <CardContent
        className={
          event.description ? "flex flex-col gap-3 pt-3" : "flex flex-col gap-3"
        }
      >
        <EventBadges event={event} />
        <EventActionLinks event={event} />
        <AdminEventActions
          masterEventId={event.masterEventId}
          admin={event.admin}
        />
      </CardContent>
    </Card>
  );
}
