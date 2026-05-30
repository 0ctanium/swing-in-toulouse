"use client";

import { CalendarDays, ExternalLink, MapPin } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatEventDate, formatEventChipTime } from "@/lib/events/format";
import type { EventOccurrence } from "@/lib/events/queries";
import { cn } from "@/lib/utils";

type EventPreviewPopoverProps = {
  event: EventOccurrence;
  triggerClassName?: string;
};

export function EventPreviewPopover({
  event,
  triggerClassName,
}: EventPreviewPopoverProps) {
  const location = event.venue?.name ?? event.locationRaw;
  const organizerLabel = event.organization?.name ?? event.source.name;
  const eventPageUrl = `/evenement/${event.slug}`;
  const chipTime = formatEventChipTime(
    event.startAt,
    event.endAt,
    event.isAllDay,
  );

  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          "block w-full truncate rounded px-1 py-0.5 text-left text-xs leading-tight transition-colors hover:bg-primary/10",
          triggerClassName,
        )}
        title={event.title}
      >
        {chipTime ? (
          <>
            <span className="text-muted-foreground tabular-nums">{chipTime}</span>{" "}
          </>
        ) : null}
        {event.title}
      </PopoverTrigger>
      <PopoverContent
        side="right"
        align="start"
        sideOffset={8}
        className="w-80 gap-0 overflow-hidden p-0 shadow-lg"
      >
        <div className="border-l-4 border-primary">
          <PopoverHeader className="gap-2 p-3 pb-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {event.status === "cancelled" ? (
                <Badge variant="destructive">Annulé</Badge>
              ) : null}
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
            </div>
            <PopoverTitle className="text-base leading-snug font-semibold">
              {event.title}
            </PopoverTitle>
          </PopoverHeader>

          <PopoverDescription className="flex flex-col gap-2 px-3 pb-3 text-sm">
            <span className="inline-flex items-start gap-2 text-foreground">
              <CalendarDays className="mt-0.5 shrink-0 text-muted-foreground" />
              {formatEventDate(event.startAt, event.endAt, event.isAllDay)}
            </span>
            {event.description ? (
              <span className="line-clamp-4 whitespace-pre-wrap text-foreground">
                {event.description}
              </span>
            ) : null}
            {location ? (
              <span className="inline-flex items-start gap-2 text-foreground">
                <MapPin className="mt-0.5 shrink-0 text-muted-foreground" />
                {event.venue ? (
                  <Link
                    href={`/lieu/${event.venue.slug}`}
                    className="hover:underline"
                  >
                    {location}
                  </Link>
                ) : (
                  location
                )}
              </span>
            ) : null}
          </PopoverDescription>

          {event.categories?.length ? (
            <div className="flex flex-wrap gap-1.5 border-t px-3 py-2">
              {event.categories.map((category) => (
                <Badge key={category} variant="outline">
                  {category}
                </Badge>
              ))}
            </div>
          ) : null}

          <div className="border-t bg-muted/30 px-3 py-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-full justify-start px-2"
              render={
                <a href={eventPageUrl} target="_blank" rel="noreferrer" />
              }
            >
              <ExternalLink data-icon="inline-start" />
              Voir la fiche complète
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
