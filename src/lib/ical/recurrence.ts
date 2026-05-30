import { addMonths, startOfDay } from "date-fns";
import { toZonedTime } from "date-fns-tz";

import { formatInTimeZone } from "date-fns-tz";

import type { Event, Organization, Source, Venue } from "@/db/schema";
import type { IcalStoredData } from "@/lib/ical/types";
import { siteConfig } from "@/lib/site";

const EXPANSION_MONTHS = 12;

type NodeIcalModule = typeof import("node-ical");
type ParsedIcalEvent = import("node-ical").VEvent;

export type EventOccurrence = {
  id: string;
  masterEventId: string;
  slug: string;
  title: string;
  description: string | null;
  startAt: Date;
  endAt: Date | null;
  isAllDay: boolean;
  locationRaw: string | null;
  sourceUrl: string | null;
  url: string;
  icalData: IcalStoredData | null;
  status: Event["status"];
  categories: string[] | null;
  organization: Organization | null;
  source: Source;
  venue: Venue | null;
  isOverridden?: boolean;
};

export type ExpansionWindow = {
  from: Date;
  to: Date;
};

export function getDefaultExpansionWindow(from = getDefaultFromDate()): ExpansionWindow {
  return {
    from,
    to: addMonths(from, EXPANSION_MONTHS),
  };
}

export function getDefaultFromDate() {
  return startOfDay(toZonedTime(new Date(), siteConfig.timezone));
}

async function loadNodeIcal(): Promise<NodeIcalModule> {
  const mod = await import("node-ical");

  if ("sync" in mod && mod.sync) {
    return mod;
  }

  if (
    "default" in mod &&
    mod.default &&
    typeof mod.default === "object" &&
    "sync" in mod.default
  ) {
    return mod.default as NodeIcalModule;
  }

  throw new Error("Unable to load node-ical parser");
}

type MasterEvent = Event & {
  source: Source;
  organization: Organization | null;
  venue: Venue | null;
};

function isWithinWindow(
  startAt: Date,
  endAt: Date | null,
  window: ExpansionWindow,
) {
  if (startAt >= window.from && startAt <= window.to) {
    return true;
  }

  if (endAt && endAt >= window.from && startAt <= window.to) {
    return true;
  }

  return false;
}

function toDate(value: Date | { toJSDate?: () => Date } | undefined) {
  if (!value) {
    return undefined;
  }

  if (value instanceof Date) {
    return value;
  }

  if (typeof value.toJSDate === "function") {
    return value.toJSDate();
  }

  return undefined;
}

function toText(value: unknown) {
  if (typeof value === "string") {
    return value.trim();
  }

  if (value && typeof value === "object" && "val" in value) {
    return String((value as { val: unknown }).val).trim();
  }

  return undefined;
}

function masterToVEvent(
  ical: NodeIcalModule,
  master: Event,
): ParsedIcalEvent | null {
  if (!master.recurrenceRule) {
    return {
      type: "VEVENT",
      uid: master.uid,
      summary: master.title,
      description: master.description ?? undefined,
      start: master.startAt,
      end: master.endAt ?? undefined,
      location: master.locationRaw ?? undefined,
      status: master.status === "cancelled" ? "CANCELLED" : "CONFIRMED",
    } as ParsedIcalEvent;
  }

  const lines = [
    "BEGIN:VEVENT",
    `UID:${master.uid}`,
    `SUMMARY:${master.title}`,
    `DTSTART;TZID=${siteConfig.timezone}:${formatInTimeZone(master.startAt, siteConfig.timezone, "yyyyMMdd'T'HHmmss")}`,
  ];

  if (master.endAt) {
    lines.push(
      `DTEND;TZID=${siteConfig.timezone}:${formatInTimeZone(master.endAt, siteConfig.timezone, "yyyyMMdd'T'HHmmss")}`,
    );
  }

  for (const line of master.recurrenceRule.split("\n")) {
    const trimmed = line.trim();
    if (
      trimmed.startsWith("RRULE:") ||
      trimmed.startsWith("EXDATE") ||
      trimmed.startsWith("RDATE")
    ) {
      lines.push(trimmed);
    }
  }

  lines.push("END:VEVENT");

  const parsed = ical.sync.parseICS(lines.join("\r\n"));
  const event = Object.values(parsed).find(
    (item) => item?.type === "VEVENT",
  ) as ParsedIcalEvent | undefined;

  return event ?? null;
}

function buildOccurrence(
  master: MasterEvent,
  startAt: Date,
  endAt: Date | null,
  title: string,
): EventOccurrence {
  return {
    id: `${master.id}#${startAt.toISOString()}`,
    masterEventId: master.id,
    slug: master.slug,
    title,
    description: master.description,
    startAt,
    endAt,
    isAllDay: master.isAllDay,
    locationRaw: master.locationRaw,
    sourceUrl: master.sourceUrl,
    url: master.url ?? "",
    icalData: master.icalData,
    status: master.status,
    categories: master.categories,
    organization: master.organization,
    source: master.source,
    venue: master.venue,
  };
}

export async function expandMasterEventsToOccurrences(
  masters: MasterEvent[],
  window: ExpansionWindow,
): Promise<EventOccurrence[]> {
  const ical = await loadNodeIcal();
  const occurrences: EventOccurrence[] = [];

  for (const master of masters) {
    if (master.recurrenceRule) {
      const vevent = masterToVEvent(ical, master);
      if (!vevent) {
        continue;
      }

      const instances = ical.expandRecurringEvent(vevent, {
        from: window.from,
        to: window.to,
        expandOngoing: true,
      });

      for (const instance of instances) {
        const startAt = toDate(instance.start);
        if (!startAt) {
          continue;
        }

        const endAt = toDate(instance.end) ?? null;
        const title = toText(instance.summary) ?? master.title;

        occurrences.push(buildOccurrence(master, startAt, endAt, title));
      }

      continue;
    }

    if (!isWithinWindow(master.startAt, master.endAt, window)) {
      continue;
    }

    occurrences.push(
      buildOccurrence(
        master,
        master.startAt,
        master.endAt,
        master.title,
      ),
    );
  }

  return occurrences.sort(
    (left, right) => left.startAt.getTime() - right.startAt.getTime(),
  );
}

export function isMasterRelevantForExport(
  master: Event,
  from = getDefaultFromDate(),
) {
  if (master.status !== "published") {
    return false;
  }

  if (master.recurrenceRule) {
    return true;
  }

  if (master.startAt >= from) {
    return true;
  }

  return Boolean(master.endAt && master.endAt >= from);
}
