"use client";

import {
  EventActionLinks,
  EventBadges,
  EventDateLine,
  EventDescriptionBlock,
  EventLocationLine,
} from "@/components/events/event-details";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatEventChipTime } from "@/lib/events/format";
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
            <span className="text-muted-foreground tabular-nums">
              {chipTime}
            </span>{" "}
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
            <EventActionLinks event={event} layout="stack" showFullPageLink />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
