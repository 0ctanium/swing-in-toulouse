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

import type { EventOccurrence } from "@/lib/events/queries";

const WEEK_OPTIONS = { weekStartsOn: 1 as const };

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

export function groupEventsByDay(events: EventOccurrence[]) {
  const map = new Map<string, EventOccurrence[]>();

  for (const event of events) {
    const key = format(event.startAt, "yyyy-MM-dd");
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
  return eventsByDay.get(format(day, "yyyy-MM-dd")) ?? [];
}

export { isSameDay, isSameMonth, isToday, addMonths, addWeeks };

export const WEEKDAY_LABELS = ["lun.", "mar.", "mer.", "jeu.", "ven.", "sam.", "dim."];

export const WEEKDAY_LABELS_COMPACT = ["L", "M", "M", "J", "V", "S", "D"];
