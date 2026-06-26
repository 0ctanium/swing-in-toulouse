import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { fr } from "date-fns/locale";
import { toZonedTime } from "date-fns-tz";

import {
  calendarDayKey,
  getEventInclusiveCalendarDay,
  isAllDayEvent,
} from "@/lib/events/format";
import type { EventOccurrence } from "@/lib/events/queries";
import { siteConfig } from "@/lib/site";

const WEEK_OPTIONS = { weekStartsOn: 1 as const };

export function getAgendaCalendarAnchor(now = new Date()) {
  return toZonedTime(now, siteConfig.timezone);
}

export function getMonthGridBounds(month: Date) {
  const start = startOfWeek(startOfMonth(month), WEEK_OPTIONS);
  const end = endOfWeek(endOfMonth(month), WEEK_OPTIONS);

  return { from: start, to: end };
}

export function getFourWeekGridBounds(anchor: Date) {
  const start = startOfWeek(anchor, WEEK_OPTIONS);
  const end = addDays(addWeeks(start, 4), -1);

  return { from: start, to: end };
}

export function getMonthGrid(month: Date) {
  const { from, to } = getMonthGridBounds(month);
  return eachDayOfInterval({ start: from, end: to });
}

export function getFourWeekGrid(anchor: Date) {
  const { from, to } = getFourWeekGridBounds(anchor);
  return eachDayOfInterval({ start: from, end: to });
}

export function formatMonthLabel(month: Date) {
  return format(month, "MMMM yyyy", { locale: fr });
}

export function formatFourWeekLabel(anchor: Date) {
  const start = startOfWeek(anchor, WEEK_OPTIONS);
  const end = addDays(addWeeks(start, 4), -1);

  return `${format(start, "d MMM", { locale: fr })} – ${format(end, "d MMM yyyy", { locale: fr })}`;
}

export function chunkDaysIntoWeeks(days: Date[]) {
  const weeks: Date[][] = [];

  for (let index = 0; index < days.length; index += 7) {
    weeks.push(days.slice(index, index + 7));
  }

  return weeks;
}

export function getEventCalendarDayRange(event: EventOccurrence) {
  const startDay = calendarDayKey(event.startAt);
  const endDay = getEventInclusiveCalendarDay(
    event.startAt,
    event.endAt,
    event.isAllDay,
  );

  return startDay <= endDay
    ? { startDay, endDay }
    : { startDay, endDay: startDay };
}

export function isAllDayCalendarEvent(event: EventOccurrence) {
  return isAllDayEvent(event.startAt, event.endAt, event.isAllDay);
}

export function isMultiDayCalendarEvent(event: EventOccurrence) {
  const { startDay, endDay } = getEventCalendarDayRange(event);
  return endDay > startDay;
}

export function isSpanStripEvent(event: EventOccurrence) {
  return isAllDayCalendarEvent(event) || isMultiDayCalendarEvent(event);
}

export function splitCalendarEvents(events: EventOccurrence[]) {
  const spanEvents: EventOccurrence[] = [];
  const timedEvents: EventOccurrence[] = [];

  for (const event of events) {
    if (isSpanStripEvent(event)) {
      spanEvents.push(event);
      continue;
    }

    timedEvents.push(event);
  }

  return { spanEvents, timedEvents };
}

export function groupEventsByDay(events: EventOccurrence[]) {
  const map = new Map<string, EventOccurrence[]>();

  for (const event of events) {
    const key = calendarDayKey(event.startAt);
    const bucket = map.get(key) ?? [];
    bucket.push(event);
    map.set(key, bucket);
  }

  for (const bucket of map.values()) {
    bucket.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
  }

  return map;
}

export function getEventsForDay(
  eventsByDay: Map<string, EventOccurrence[]>,
  day: Date,
) {
  return eventsByDay.get(calendarDayKey(day)) ?? [];
}

export type CalendarAllDayPlacement = {
  event: EventOccurrence;
  lane: number;
  startCol: number;
  span: number;
  continuesBefore: boolean;
  continuesAfter: boolean;
  showTitle: boolean;
};

type CalendarAllDaySegment = {
  event: EventOccurrence;
  startCol: number;
  endColExclusive: number;
  continuesBefore: boolean;
  continuesAfter: boolean;
  showTitle: boolean;
};

function placementCoversColumn(
  placement: Pick<CalendarAllDayPlacement, "startCol" | "span">,
  column: number,
) {
  return (
    column >= placement.startCol && column < placement.startCol + placement.span
  );
}

function buildAllDaySegment(
  event: EventOccurrence,
  weekDays: Date[],
): CalendarAllDaySegment | null {
  const { startDay, endDay } = getEventCalendarDayRange(event);
  const weekStartDay = calendarDayKey(weekDays[0]!);
  const weekEndDay = calendarDayKey(weekDays[6]!);

  if (endDay < weekStartDay || startDay > weekEndDay) {
    return null;
  }

  const effectiveStartDay = startDay < weekStartDay ? weekStartDay : startDay;
  const effectiveEndDay = endDay > weekEndDay ? weekEndDay : endDay;
  const startCol = weekDays.findIndex(
    (day) => calendarDayKey(day) === effectiveStartDay,
  );
  const endCol = weekDays.findIndex(
    (day) => calendarDayKey(day) === effectiveEndDay,
  );

  if (startCol < 0 || endCol < 0) {
    return null;
  }

  return {
    event,
    startCol,
    endColExclusive: endCol + 1,
    continuesBefore: startDay < weekStartDay,
    continuesAfter: endDay > weekEndDay,
    showTitle: true,
  };
}

export function layoutWeekSpanEvents(
  weekDays: Date[],
  spanEvents: EventOccurrence[],
): CalendarAllDayPlacement[] {
  const segments = spanEvents
    .map((event) => buildAllDaySegment(event, weekDays))
    .filter((segment): segment is CalendarAllDaySegment => segment !== null)
    .sort((left, right) => {
      const leftSpan = left.endColExclusive - left.startCol;
      const rightSpan = right.endColExclusive - right.startCol;

      if (leftSpan !== rightSpan) {
        return rightSpan - leftSpan;
      }

      return left.startCol - right.startCol;
    });

  const laneSegments: CalendarAllDaySegment[][] = [];
  const placements: CalendarAllDayPlacement[] = [];

  for (const segment of segments) {
    let lane = 0;

    while (true) {
      const occupied = laneSegments[lane] ?? [];
      const overlaps = occupied.some(
        (existing) =>
          segment.startCol < existing.endColExclusive &&
          segment.endColExclusive > existing.startCol,
      );

      if (!overlaps) {
        laneSegments[lane] = [...occupied, segment];
        placements.push({
          event: segment.event,
          lane,
          startCol: segment.startCol,
          span: segment.endColExclusive - segment.startCol,
          continuesBefore: segment.continuesBefore,
          continuesAfter: segment.continuesAfter,
          showTitle: segment.showTitle,
        });
        break;
      }

      lane += 1;
    }
  }

  return placements.sort(
    (left, right) => left.lane - right.lane || left.startCol - right.startCol,
  );
}

export type CalendarDayView = {
  allDayPlacements: CalendarAllDayPlacement[];
  timedEvents: EventOccurrence[];
  hiddenCount: number;
};

export function getWeekDayViews(
  weekDays: Date[],
  allDayPlacements: CalendarAllDayPlacement[],
  timedEventsByDay: Map<string, EventOccurrence[]>,
  visibleEventCount: number,
): CalendarDayView[] {
  const maxVisibleLane = visibleEventCount - 1;
  const visiblePlacements = allDayPlacements.filter(
    (placement) => placement.lane <= maxVisibleLane,
  );
  const hiddenPlacements = allDayPlacements.filter(
    (placement) => placement.lane > maxVisibleLane,
  );

  return weekDays.map((day, column) => {
    const dayKey = calendarDayKey(day);
    const allDayVisible = visiblePlacements.filter((placement) =>
      placementCoversColumn(placement, column),
    );
    const allDayHidden = hiddenPlacements.filter((placement) =>
      placementCoversColumn(placement, column),
    );
    const timedEvents = getEventsForDay(timedEventsByDay, day);
    const timedSlots = Math.max(0, visibleEventCount - allDayVisible.length);
    const timedVisible = timedEvents.slice(0, timedSlots);
    const timedHidden = timedEvents.length - timedVisible.length;

    return {
      allDayPlacements: allDayVisible,
      timedEvents: timedVisible,
      hiddenCount: allDayHidden.length + timedHidden,
    };
  });
}

export function layoutWeekAllDayEvents(
  weekDays: Date[],
  spanEvents: EventOccurrence[],
) {
  return layoutWeekSpanEvents(weekDays, spanEvents);
}

export function getDaySpanLaneCount(
  column: number,
  placements: CalendarAllDayPlacement[],
  visibleEventCount: number,
) {
  const lanesOnDay = placements
    .filter((placement) => placement.lane < visibleEventCount)
    .filter((placement) => placementCoversColumn(placement, column))
    .map((placement) => placement.lane);

  if (lanesOnDay.length === 0) {
    return 0;
  }

  return Math.max(...lanesOnDay) + 1;
}

export function getSpanStripHeightStyle(laneCount: number) {
  if (laneCount === 0) {
    return undefined;
  }

  return `calc(${laneCount} * var(--span-bar-h) + ${laneCount - 1} * var(--span-lane-gap) + var(--span-strip-gap))`;
}

/** @deprecated Use getSpanStripHeightStyle with CSS variables on the week row. */
export function getSpanStripHeight(laneCount: number) {
  if (laneCount === 0) {
    return 0;
  }

  const barHeight = 18;
  const laneGap = 2;
  const stripGap = 2;

  return laneCount * barHeight + (laneCount - 1) * laneGap + stripGap;
}

export const CALENDAR_SPAN_STRIP_VARS =
  "[--day-head-h:calc(0.125rem+1.25rem)] [--span-bar-h:1.125rem] [--span-lane-gap:0.125rem] [--span-strip-gap:0.125rem] sm:[--day-head-h:calc(0.5rem+1.75rem)] sm:[--span-bar-h:1.25rem] sm:[--span-lane-gap:0.25rem] sm:[--span-strip-gap:0.25rem]";

export function getSpanBarTopStyle(lane: number) {
  return `calc(${lane} * (var(--span-bar-h) + var(--span-lane-gap)))`;
}

export function getWeekSpanLaneCount(
  placements: CalendarAllDayPlacement[],
  visibleEventCount: number,
) {
  if (placements.length === 0) {
    return 0;
  }

  const maxLane = Math.max(...placements.map((placement) => placement.lane));
  return Math.min(maxLane + 1, visibleEventCount);
}

export function getWeekAllDayLaneCount(
  placements: CalendarAllDayPlacement[],
  visibleEventCount: number,
) {
  return getWeekSpanLaneCount(placements, visibleEventCount);
}

export { isSameDay, isSameMonth, isToday, addMonths, addWeeks };

export const WEEKDAY_LABELS = [
  "lun.",
  "mar.",
  "mer.",
  "jeu.",
  "ven.",
  "sam.",
  "dim.",
];

export const WEEKDAY_LABELS_COMPACT = ["L", "M", "M", "J", "V", "S", "D"];
