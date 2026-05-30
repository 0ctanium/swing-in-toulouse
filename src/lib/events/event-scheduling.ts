import { startOfDay } from "date-fns";
import { toZonedTime } from "date-fns-tz";

import type { EventMaster } from "@/db/schema";
import {
  expandMasterEventsToOccurrences,
  getDefaultExpansionWindow,
  getDefaultFromDate,
} from "@/lib/ical/recurrence";
import { siteConfig } from "@/lib/site";

export async function buildNextOccurrenceMap(recurringMasters: EventMaster[]) {
  const nextOccurrenceById = new Map<string, Date>();
  if (recurringMasters.length === 0) {
    return nextOccurrenceById;
  }

  const today = getDefaultFromDate();
  const window = getDefaultExpansionWindow();
  const occurrences = await expandMasterEventsToOccurrences(
    recurringMasters,
    window,
  );

  for (const occurrence of occurrences) {
    if (occurrence.startAt < today) {
      continue;
    }

    const existing = nextOccurrenceById.get(occurrence.masterEventId);
    if (!existing || occurrence.startAt < existing) {
      nextOccurrenceById.set(occurrence.masterEventId, occurrence.startAt);
    }
  }

  return nextOccurrenceById;
}

export function getEventScheduling(
  event: Pick<EventMaster, "id" | "startAt" | "endAt" | "recurrenceRule">,
  today: Date,
  nextOccurrenceById: Map<string, Date>,
) {
  if (event.recurrenceRule) {
    const nextOccurrence = nextOccurrenceById.get(event.id);
    if (nextOccurrence) {
      return { isUpcoming: true, sortAt: nextOccurrence };
    }
  }

  const end = event.endAt ?? event.startAt;
  return {
    isUpcoming: end >= today,
    sortAt: event.startAt,
  };
}

export function sortEventsForAdmin<
  T extends Pick<EventMaster, "id" | "startAt" | "endAt" | "recurrenceRule">,
>(rows: T[], nextOccurrenceById: Map<string, Date>) {
  const today = startOfDay(toZonedTime(new Date(), siteConfig.timezone));
  const upcoming: Array<{ row: T; sortAt: Date }> = [];
  const past: Array<{ row: T; sortAt: Date }> = [];

  for (const row of rows) {
    const scheduling = getEventScheduling(row, today, nextOccurrenceById);
    if (scheduling.isUpcoming) {
      upcoming.push({ row, sortAt: scheduling.sortAt });
    } else {
      past.push({ row, sortAt: scheduling.sortAt });
    }
  }

  upcoming.sort((left, right) => left.sortAt.getTime() - right.sortAt.getTime());
  past.sort((left, right) => right.sortAt.getTime() - left.sortAt.getTime());

  return [...upcoming, ...past].map((entry) => ({
    row: entry.row,
    sortAt: entry.sortAt,
    isUpcoming: upcoming.some((item) => item.row.id === entry.row.id),
  }));
}

export function getEventDisplayDate(
  event: Pick<EventMaster, "id" | "startAt" | "recurrenceRule">,
  nextOccurrenceById: Map<string, Date>,
) {
  if (event.recurrenceRule) {
    return nextOccurrenceById.get(event.id) ?? event.startAt;
  }

  return event.startAt;
}
