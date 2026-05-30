import { formatInTimeZone } from "date-fns-tz";

import { siteConfig } from "@/lib/site";

import type {
  IcalStoredData,
  NormalizedEvent,
  NormalizedOrganizer,
} from "./types";

type ParsedIcalEvent = import("node-ical").VEvent;
type Organizer = import("node-ical").Organizer;
type Attendee = import("node-ical").Attendee;

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

function getParams(value: unknown) {
  if (value && typeof value === "object" && "params" in value) {
    return (value as { params: Record<string, string> }).params;
  }

  return undefined;
}

function parseOrganizer(organizer: Organizer | undefined): NormalizedOrganizer | undefined {
  if (!organizer) {
    return undefined;
  }

  const raw = toText(organizer);
  const email = raw?.replace(/^mailto:/i, "");
  const params = getParams(organizer);
  const name = params?.CN?.trim() || email || "";

  if (!name && !email) {
    return undefined;
  }

  return {
    name,
    email: email?.includes("@") ? email : undefined,
  };
}

function parseAttendees(value: Attendee | Attendee[] | undefined) {
  if (!value) {
    return undefined;
  }

  const attendees = Array.isArray(value) ? value : [value];

  return attendees
    .map((attendee) => {
      const raw = toText(attendee);
      const email = raw?.replace(/^mailto:/i, "");
      const params = getParams(attendee);

      return {
        name: params?.CN?.trim(),
        email: email?.includes("@") ? email : undefined,
        role: params?.ROLE,
        partstat: params?.PARTSTAT,
        rsvp: params?.RSVP,
      };
    })
    .filter((attendee) => attendee.name || attendee.email);
}

function parseGeo(value: unknown) {
  if (!value) {
    return undefined;
  }

  if (typeof value === "object" && value !== null) {
    const geo = value as { lat?: number; lon?: number; latitude?: number; longitude?: number };
    const lat = geo.lat ?? geo.latitude;
    const lon = geo.lon ?? geo.longitude;

    if (typeof lat === "number" && typeof lon === "number") {
      return { lat, lon };
    }
  }

  if (typeof value === "string") {
    const [latRaw, lonRaw] = value.split(";");
    const lat = Number(latRaw);
    const lon = Number(lonRaw);

    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      return { lat, lon };
    }
  }

  return undefined;
}

function formatExdateLine(date: Date, isAllDay: boolean) {
  if (isAllDay) {
    return `EXDATE;VALUE=DATE:${formatInTimeZone(date, siteConfig.timezone, "yyyyMMdd")}`;
  }

  return `EXDATE;TZID=${siteConfig.timezone}:${formatInTimeZone(date, siteConfig.timezone, "yyyyMMdd'T'HHmmss")}`;
}

function extractRecurrenceLines(item: ParsedIcalEvent) {
  const lines: string[] = [];

  if (item.rrule) {
    const rrule =
      typeof item.rrule === "string" ? item.rrule : String(item.rrule);
    lines.push(rrule.includes("RRULE:") ? rrule : `RRULE:${rrule}`);
  }

  if (item.exdate) {
    const isAllDay = item.datetype === "date";

    for (const exdate of Object.values(item.exdate)) {
      const date = toDate(exdate);
      if (date) {
        lines.push(formatExdateLine(date, isAllDay));
      }
    }
  }

  return lines.length > 0 ? lines.join("\n") : undefined;
}

function serializeAlarms(item: ParsedIcalEvent) {
  if (!item.alarms?.length) {
    return undefined;
  }

  return item.alarms.map((alarm) => ({
    action: alarm.action,
    trigger: String(alarm.trigger),
    description: alarm.description,
    summary: alarm.summary,
    repeat: alarm.repeat,
  }));
}

function serializeRecurrenceOverrides(item: ParsedIcalEvent) {
  if (!item.recurrences) {
    return undefined;
  }

  const overrides: Record<string, unknown> = {};

  for (const [key, override] of Object.entries(item.recurrences)) {
    overrides[key] = {
      summary: toText(override.summary),
      description: toText(override.description),
      location: toText(override.location),
      start: toDate(override.start as Date | { toJSDate?: () => Date })?.toISOString(),
      end: toDate(override.end as Date | { toJSDate?: () => Date })?.toISOString(),
      status: override.status,
    };
  }

  return overrides;
}

function buildIcalData(item: ParsedIcalEvent): IcalStoredData {
  return {
    dtstamp: toDate(item.dtstamp)?.toISOString(),
    created: toDate(item.created)?.toISOString(),
    datetype: item.datetype,
    method: item.method,
    icalStatus: item.status,
    transparency: item.transparency,
    class: item.class,
    geo: parseGeo(item.geo),
    organizer: parseOrganizer(item.organizer),
    attendees: parseAttendees(item.attendee),
    recurrenceId: toDate(item.recurrenceid)?.toISOString(),
    alarms: serializeAlarms(item),
    recurrences: serializeRecurrenceOverrides(item),
  };
}

function mapStatus(status: string | undefined): NormalizedEvent["status"] {
  if (status?.toUpperCase() === "CANCELLED") {
    return "cancelled";
  }

  return "confirmed";
}

export function mapVEventToNormalized(item: ParsedIcalEvent): NormalizedEvent | null {
  const startAt = toDate(item.start);
  const title = toText(item.summary);

  if (!startAt || !item.uid || !title) {
    return null;
  }

  const endAt = toDate(item.end);
  const lastModified = toDate(item.lastmodified) ?? startAt;
  const sequence =
    typeof item.sequence === "number" && Number.isFinite(item.sequence)
      ? item.sequence
      : 0;
  const isAllDay = item.datetype === "date";

  return {
    uid: String(item.uid),
    title,
    description: toText(item.description),
    startAt,
    endAt,
    isAllDay,
    location: toText(item.location),
    sourceUrl: toText(item.url),
    status: mapStatus(item.status),
    categories: parseCategories(item.categories),
    organizer: parseOrganizer(item.organizer),
    sequence,
    lastModified,
    recurrenceRule: extractRecurrenceLines(item),
    icalData: buildIcalData(item),
  };
}

function parseCategories(value: string | string[] | undefined) {
  if (!value) {
    return undefined;
  }

  const items = Array.isArray(value) ? value : value.split(",");

  return items.map((item) => item.trim()).filter(Boolean);
}
