"use client";

import { CalendarDays, Link2, MapPin, User } from "lucide-react";
import Link from "next/link";
import posthog from "posthog-js";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  formatIcalStatus,
  formatTransparency,
  getGeoMapsUrl,
  getIcalOrganizer,
  shouldShowIcalOrganizer,
} from "@/lib/events/display";
import { formatEventDate } from "@/lib/events/format";
import type { EventOccurrence } from "@/lib/events/queries";
import { cn } from "@/lib/utils";

export type EventDisplayData = Pick<
  EventOccurrence,
  | "title"
  | "description"
  | "startAt"
  | "endAt"
  | "isAllDay"
  | "locationRaw"
  | "sourceUrl"
  | "status"
  | "categories"
  | "organization"
  | "source"
  | "venue"
  | "slug"
> & {
  icalData?: EventOccurrence["icalData"];
};

type EventBadgesProps = {
  event: EventDisplayData;
  className?: string;
};

export function EventBadges({ event, className }: EventBadgesProps) {
  const tentativeLabel = formatIcalStatus(event.icalData?.icalStatus);

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {event.organization ? (
        <Badge variant="secondary">
          <Link
            href={`/organisateur/${event.organization.slug}`}
            className="hover:underline"
          >
            {event.organization.name}
          </Link>
        </Badge>
      ) : null}
      {event.status === "cancelled" ? (
        <Badge variant="destructive">Annulé</Badge>
      ) : null}
      {tentativeLabel === "Provisoire" ? (
        <Badge variant="outline">Provisoire</Badge>
      ) : null}
      {event.categories?.map((category) => (
        <Badge key={category} variant="outline">
          {category}
        </Badge>
      ))}
    </div>
  );
}

type EventDateLineProps = {
  event: Pick<EventDisplayData, "startAt" | "endAt" | "isAllDay">;
  className?: string;
};

export function EventDateLine({ event, className }: EventDateLineProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <CalendarDays className="mt-0.5 shrink-0 text-muted-foreground" />
      {formatEventDate(event.startAt, event.endAt, event.isAllDay)}
    </span>
  );
}

type EventLocationLineProps = {
  event: Pick<EventDisplayData, "locationRaw" | "venue" | "icalData">;
  className?: string;
};

export function EventLocationLine({
  event,
  className,
}: EventLocationLineProps) {
  const location = event.venue?.name ?? event.locationRaw;
  const mapsUrl = event.icalData?.geo
    ? getGeoMapsUrl(event.icalData.geo)
    : null;

  if (!location && !mapsUrl) {
    return null;
  }

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <MapPin className="mt-0.5 shrink-0 text-muted-foreground" />
      <span className="flex flex-col gap-1">
        {location ? (
          event.venue ? (
            <Link
              href={`/lieu/${event.venue.slug}`}
              className="hover:underline"
            >
              {location}
            </Link>
          ) : (
            location
          )
        ) : null}
        {mapsUrl ? (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="text-muted-foreground text-sm hover:underline"
          >
            Voir sur la carte
          </a>
        ) : null}
      </span>
    </span>
  );
}

type EventDescriptionBlockProps = {
  description: string | null | undefined;
  className?: string;
  clamp?: number;
};

export function EventDescriptionBlock({
  description,
  className,
  clamp,
}: EventDescriptionBlockProps) {
  if (!description) {
    return null;
  }

  return (
    <p
      className={cn(
        "whitespace-pre-wrap",
        clamp === 3 && "line-clamp-3",
        clamp === 4 && "line-clamp-4",
        className,
      )}
    >
      {description}
    </p>
  );
}

type EventMetaLinesProps = {
  event: EventDisplayData;
  className?: string;
};

export function EventMetaLines({ event, className }: EventMetaLinesProps) {
  const organizer = getIcalOrganizer(event.icalData);
  const showOrganizer = shouldShowIcalOrganizer(
    event.icalData,
    event.organization?.name,
  );
  const transparency = formatTransparency(event.icalData?.transparency);

  if (!showOrganizer && !transparency) {
    return null;
  }

  return (
    <div className={cn("flex flex-col gap-2 text-sm", className)}>
      {showOrganizer && organizer ? (
        <span className="inline-flex items-center gap-2">
          <User className="mt-0.5 shrink-0 text-muted-foreground" />
          {organizer.email ? (
            <a href={`mailto:${organizer.email}`} className="hover:underline">
              {organizer.name || organizer.email}
            </a>
          ) : (
            organizer.name
          )}
        </span>
      ) : null}
      {transparency ? (
        <span className="text-muted-foreground">{transparency}</span>
      ) : null}
    </div>
  );
}

type EventActionLinksProps = {
  event: Pick<EventDisplayData, "slug" | "sourceUrl">;
  className?: string;
  layout?: "row" | "stack";
};

export function EventActionLinks({
  event,
  className,
  layout = "row",
}: EventActionLinksProps) {
  if (!event.sourceUrl) {
    return null;
  }

  return (
    <div
      className={cn(
        layout === "stack" ? "flex flex-col gap-1" : "flex flex-wrap gap-2",
        className,
      )}
    >
      <Button
        variant="outline"
        size="sm"
        className={
          layout === "stack" ? "h-8 w-full justify-start px-2" : undefined
        }
        nativeButton={false}
        render={
          <a
            href={event.sourceUrl}
            target="_blank"
            rel="noreferrer"
            onClick={() =>
              posthog.capture("event_external_link_clicked", {
                event_slug: event.slug,
                source_url: event.sourceUrl,
              })
            }
          />
        }
      >
        <Link2 data-icon="inline-start" />
        Lien externe
      </Button>
    </div>
  );
}
