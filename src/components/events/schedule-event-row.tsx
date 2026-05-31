"use client";

import { EventPreviewPopover } from "@/components/events/event-preview-popover";
import { formatEventScheduleTime } from "@/lib/events/format";
import type { EventOccurrence } from "@/lib/events/queries";
import {
  getScheduleEventColor,
  getScheduleEventColorSeed,
} from "@/lib/events/schedule-colors";
import { cn } from "@/lib/utils";

function getEventLocation(event: EventOccurrence) {
  return event.venue?.name ?? event.locationRaw;
}

type ScheduleEventRowProps = {
  event: EventOccurrence;
};

export function ScheduleEventRow({ event }: ScheduleEventRowProps) {
  const timeLabel = formatEventScheduleTime(
    event.startAt,
    event.endAt,
    event.isAllDay,
  );
  const location = getEventLocation(event);
  const cancelled = event.status === "cancelled";
  const color = getScheduleEventColor(getScheduleEventColorSeed(event));

  return (
    <EventPreviewPopover
      event={event}
      contentSide="right"
      triggerClassName={cn(
        "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-background/70",
        cancelled && "opacity-60",
      )}
    >
      <span
        aria-hidden
        className="mt-1.5 size-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
      />
      <span className="w-28 shrink-0 text-sm text-muted-foreground tabular-nums sm:w-32">
        {timeLabel}
      </span>
      <span className="min-w-0 flex-1 text-sm leading-snug">
        <span
          className={cn(
            "font-medium text-foreground",
            cancelled && "line-through",
          )}
        >
          {event.title}
        </span>
        {location ? (
          <span className="text-muted-foreground"> · {location}</span>
        ) : null}
      </span>
    </EventPreviewPopover>
  );
}
