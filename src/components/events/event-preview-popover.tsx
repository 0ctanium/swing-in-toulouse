"use client";

import type { ReactNode } from "react";

import { AdminEventActions } from "@/components/admin/admin-event-actions";
import {
  EventActionLinks,
  EventBadges,
  EventDateLine,
  EventDescriptionBlock,
  EventLocationLine,
} from "@/components/events/event-details";
import { SrOnlyEntityLink } from "@/components/seo/sr-only-entity-link";
import { PopoverFicheLink } from "@/components/seo/popover-fiche-link";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatEventChipTime } from "@/lib/events/format";
import type { AdminEventMeta } from "@/lib/events/admin-meta";
import type { EventOccurrence } from "@/lib/events/queries";
import { cn } from "@/lib/utils";

type EventPreviewPopoverProps = {
  event: EventOccurrence & { admin?: AdminEventMeta };
  triggerClassName?: string;
  children?: ReactNode;
  contentSide?: "top" | "right" | "bottom" | "left";
};

export function EventPreviewPopover({
  event,
  triggerClassName,
  children,
  contentSide = "right",
}: EventPreviewPopoverProps) {
  const chipTime = formatEventChipTime(
    event.startAt,
    event.endAt,
    event.isAllDay,
  );

  return (
    <>
      <SrOnlyEntityLink
        href={`/evenement/${event.slug}`}
        label={event.title}
      />
      <Popover>
      <PopoverTrigger
        className={cn(
          !children &&
            "block w-full truncate rounded px-1 py-0.5 text-left text-xs leading-tight transition-colors hover:bg-primary/10",
          triggerClassName,
        )}
        aria-label={`Aperçu de ${event.title}`}
        title={event.title}
      >
        {children ?? (
          <>
            {chipTime ? (
              <>
                <span className="text-muted-foreground tabular-nums">
                  {chipTime}
                </span>{" "}
              </>
            ) : null}
            {event.title}
          </>
        )}
      </PopoverTrigger>
      <PopoverContent
        side={contentSide}
        align="start"
        sideOffset={8}
        className="w-80 gap-0 overflow-hidden p-0 shadow-lg"
      >
        <div className="border-l-4 border-primary">
          <PopoverHeader className="gap-2 p-3 pb-2">
            <EventBadges event={event} />
            <PopoverTitle className="text-base leading-snug font-semibold">
              {event.title}
            </PopoverTitle>
          </PopoverHeader>

          <PopoverDescription className="flex flex-col gap-2 px-3 pb-3 text-sm">
            <EventDateLine event={event} className="text-foreground" />
            <EventDescriptionBlock
              description={event.description}
              clamp={4}
              className="text-foreground"
            />
            <EventLocationLine event={event} className="text-foreground" />
          </PopoverDescription>

          <div className="border-t bg-muted/30 px-3 py-2">
            <div className="flex flex-col gap-2">
              <AdminEventActions
                masterEventId={event.masterEventId}
                admin={event.admin}
                compact
              />
              <PopoverFicheLink
                href={`/evenement/${event.slug}`}
                label={event.title}
                embedded
              />
              <EventActionLinks event={event} layout="stack" />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
    </>
  );
}
