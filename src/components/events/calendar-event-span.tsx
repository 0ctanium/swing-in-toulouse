"use client";

import { EventPreviewPopover } from "@/components/events/event-preview-popover";
import type { CalendarAllDayPlacement } from "@/lib/events/calendar";
import { getSpanBarTopStyle } from "@/lib/events/calendar";
import {
  getScheduleEventColor,
  getScheduleEventColorSeed,
} from "@/lib/events/schedule-colors";
import { cn } from "@/lib/utils";

const COLUMN_COUNT = 7;

type CalendarEventSpanBarProps = {
  placement: CalendarAllDayPlacement;
};

export function CalendarEventSpanBar({ placement }: CalendarEventSpanBarProps) {
  const { event, continuesBefore, continuesAfter } = placement;
  const color = getScheduleEventColor(getScheduleEventColorSeed(event));
  const columnWidth = 100 / COLUMN_COUNT;
  const edgeInsetCount =
    (continuesBefore ? 0 : 1) + (continuesAfter ? 0 : 1);

  return (
    <div
      className="pointer-events-auto absolute flex min-w-0 items-center overflow-hidden"
      style={{
        left: continuesBefore
          ? `${placement.startCol * columnWidth}%`
          : `calc(${placement.startCol * columnWidth}% + var(--span-inset))`,
        width:
          edgeInsetCount === 0
            ? `${placement.span * columnWidth}%`
            : `calc(${placement.span * columnWidth}% - ${edgeInsetCount} * var(--span-inset))`,
        top: getSpanBarTopStyle(placement.lane),
        height: "var(--span-bar-h)",
      }}
    >
      <EventPreviewPopover
        event={event}
        contentSide="bottom"
        triggerClassName="block h-full w-full max-w-full min-w-0 overflow-hidden"
      >
        <span
          className={cn(
            "flex h-full w-full max-w-full items-center truncate overflow-hidden px-1 text-left text-[10px] font-medium text-white sm:text-xs",
            continuesBefore ? "rounded-l-none" : "rounded-l-sm",
            continuesAfter ? "rounded-r-none" : "rounded-r-sm",
          )}
          style={{ backgroundColor: color }}
        >
          {event.title}
        </span>
      </EventPreviewPopover>
    </div>
  );
}
