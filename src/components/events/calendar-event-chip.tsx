"use client";

import { EventPreviewPopover } from "@/components/events/event-preview-popover";
import { formatEventChipTime } from "@/lib/events/format";
import type { EventOccurrence } from "@/lib/events/queries";
import {
  getScheduleEventColor,
  getScheduleEventColorSeed,
} from "@/lib/events/schedule-colors";
import { cn } from "@/lib/utils";

type CalendarEventChipProps = {
  event: EventOccurrence;
};

export function CalendarEventChip({ event }: CalendarEventChipProps) {
  const chipTime = formatEventChipTime(
    event.startAt,
    event.endAt,
    event.isAllDay,
  );
  const color = getScheduleEventColor(getScheduleEventColorSeed(event));

  return (
    <EventPreviewPopover
      event={event}
      contentSide="bottom"
      triggerClassName="pointer-events-auto block w-full min-w-0"
    >
      <span
        className="block w-full truncate rounded-sm px-1 py-0.5 text-left text-[10px] leading-tight font-medium text-white sm:hidden"
        style={{ backgroundColor: color }}
      >
        {event.title}
      </span>
      <span
        className={cn(
          "hidden w-full truncate rounded px-1 py-0.5 text-left text-xs leading-tight transition-colors hover:bg-primary/10 sm:block",
        )}
      >
        {chipTime ? (
          <>
            <span className="text-muted-foreground tabular-nums">{chipTime}</span>{" "}
          </>
        ) : null}
        {event.title}
      </span>
    </EventPreviewPopover>
  );
}
