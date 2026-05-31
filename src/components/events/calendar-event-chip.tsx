"use client";

import { EventPreviewPopover } from "@/components/events/event-preview-popover";
import { formatEventChipTime } from "@/lib/events/format";
import type { EventOccurrence } from "@/lib/events/queries";
import {
  getScheduleEventColor,
  getScheduleEventColorSeed,
} from "@/lib/events/schedule-colors";

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
      triggerClassName="pointer-events-auto block w-full max-w-full min-w-0 overflow-hidden rounded-sm transition-colors hover:bg-primary/10"
    >
      <span className="flex min-h-[var(--span-bar-h,1.125rem)] w-full max-w-full min-w-0 items-center gap-1 overflow-hidden rounded-sm px-1 py-0.5 text-left text-[10px] leading-tight font-medium sm:min-h-[var(--span-bar-h,1.25rem)] sm:text-xs">
        <span
          className="size-1.5 shrink-0 rounded-full sm:size-2"
          style={{ backgroundColor: color }}
          aria-hidden
        />
        {chipTime ? (
          <span className="shrink-0 text-muted-foreground tabular-nums">
            {chipTime}
          </span>
        ) : null}
        <span className="min-w-0 truncate">{event.title}</span>
      </span>
    </EventPreviewPopover>
  );
}
