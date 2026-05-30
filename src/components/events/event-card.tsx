import { CalendarDays, MapPin } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatEventDate } from "@/lib/events/format";
import type { EventOccurrence } from "@/lib/events/queries";

type EventCardProps = {
  event: EventOccurrence;
};

export function EventCard({ event }: EventCardProps) {
  const location = event.venue?.name ?? event.locationRaw;
  const organizerLabel = event.organization?.name ?? event.source.name;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <CardTitle className="text-xl">
            <Link href={`/evenement/${event.slug}`} className="hover:underline">
              {event.title}
            </Link>
          </CardTitle>
          {event.status === "cancelled" ? (
            <Badge variant="destructive">Annulé</Badge>
          ) : null}
        </div>
        <CardDescription className="flex flex-col gap-1">
          <span className="inline-flex items-center gap-2">
            <CalendarDays />
            {formatEventDate(event.startAt, event.endAt, event.isAllDay)}
          </span>
          {location ? (
            <span className="inline-flex items-center gap-2">
              <MapPin />
              {event.venue ? (
                <Link href={`/lieu/${event.venue.slug}`} className="hover:underline">
                  {location}
                </Link>
              ) : (
                location
              )}
            </span>
          ) : null}
        </CardDescription>
      </CardHeader>
      {event.description ? (
        <CardContent className="pt-0">
          <p className="text-muted-foreground line-clamp-3 whitespace-pre-wrap text-sm">
            {event.description}
          </p>
        </CardContent>
      ) : null}
      <CardContent className={event.description ? "flex flex-wrap items-center gap-2 pt-3" : "flex flex-wrap items-center gap-2"}>
        {event.organization ? (
          <Badge variant="secondary">
            <Link
              href={`/organisateur/${event.organization.slug}`}
              className="hover:underline"
            >
              {organizerLabel}
            </Link>
          </Badge>
        ) : (
          <Badge variant="outline">{organizerLabel}</Badge>
        )}
        {event.categories?.map((category) => (
          <Badge key={category} variant="outline">
            {category}
          </Badge>
        ))}
      </CardContent>
    </Card>
  );
}
