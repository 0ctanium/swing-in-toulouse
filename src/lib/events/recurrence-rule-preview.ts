import { toZonedTime } from "date-fns-tz";

import type { Event } from "@/db/schema";
import {
  buildRecurrenceRule,
  type RecurrenceFormValue,
} from "@/lib/events/recurrence-rule";
import {
  expandMasterEventsToOccurrences,
  getDefaultExpansionWindow,
} from "@/lib/ical/recurrence";
import { siteConfig } from "@/lib/site";

export async function previewRecurrenceOccurrences(
  value: RecurrenceFormValue,
  anchor: Pick<Event, "startAt" | "endAt" | "isAllDay" | "uid" | "title">,
  limit = 5,
) {
  const recurrenceRule = buildRecurrenceRule(
    value,
    anchor.startAt,
    anchor.isAllDay,
  );

  if (!recurrenceRule) {
    return [];
  }

  const master = {
    id: "preview",
    uid: anchor.uid ?? "preview@manual",
    slug: "preview",
    title: anchor.title ?? "Aperçu",
    description: null,
    startAt: anchor.startAt,
    endAt: anchor.endAt,
    isAllDay: anchor.isAllDay,
    locationRaw: null,
    sourceUrl: null,
    url: "",
    icalData: null,
    status: "published" as const,
    categories: null,
    recurrenceRule,
    source: { type: "manual" as const, name: "manual" },
    organization: null,
    venue: null,
  };

  const window = getDefaultExpansionWindow(
    toZonedTime(anchor.startAt, siteConfig.timezone),
  );
  const occurrences = await expandMasterEventsToOccurrences(
    [master as never],
    window,
  );

  return occurrences.slice(0, limit).map((occurrence) => ({
    startAt: occurrence.startAt.toISOString(),
    endAt: occurrence.endAt?.toISOString() ?? null,
  }));
}
