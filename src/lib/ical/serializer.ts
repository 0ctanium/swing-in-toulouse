import { formatInTimeZone } from "date-fns-tz";

import { siteConfig } from "@/lib/site";

import type { CalendarFeedMeta, EventStatus, NormalizedEvent } from "./types";

const TIMEZONE = siteConfig.timezone;

function escapeIcalText(value: string) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

function foldLine(line: string) {
  const maxLength = 75;
  if (line.length <= maxLength) {
    return line;
  }

  const chunks: string[] = [];
  let remaining = line;

  chunks.push(remaining.slice(0, maxLength));
  remaining = remaining.slice(maxLength);

  while (remaining.length > 0) {
    chunks.push(` ${remaining.slice(0, maxLength - 1)}`);
    remaining = remaining.slice(maxLength - 1);
  }

  return chunks.join("\r\n");
}

function formatUtc(date: Date) {
  return formatInTimeZone(date, "UTC", "yyyyMMdd'T'HHmmss'Z'");
}

function formatLocal(date: Date) {
  return formatInTimeZone(date, TIMEZONE, "yyyyMMdd'T'HHmmss");
}

function mapDbStatus(status: EventStatus | "published" | "cancelled") {
  if (status === "cancelled") {
    return "CANCELLED";
  }

  return "CONFIRMED";
}

function writeProperty(name: string, value: string, params?: string) {
  const key = params ? `${name};${params}` : name;
  return foldLine(`${key}:${value}`);
}

function writeOrganizer(organizer: NonNullable<NormalizedEvent["organizer"]>) {
  if (organizer.email) {
    return foldLine(
      `ORGANIZER;CN=${escapeIcalText(organizer.name)}:mailto:${organizer.email}`,
    );
  }

  return writeProperty("ORGANIZER", escapeIcalText(organizer.name));
}

function writeGeo(geo: NonNullable<NormalizedEvent["geo"]>) {
  return writeProperty("GEO", `${geo.lat};${geo.lon}`);
}

function writeAppleStructuredLocation(
  structuredLocation: NonNullable<NormalizedEvent["structuredLocation"]>,
) {
  const { title, geo } = structuredLocation;

  return foldLine(
    `X-APPLE-STRUCTURED-LOCATION;VALUE=URI;X-APPLE-RADIUS=72;X-TITLE=${escapeIcalText(title)}:geo:${geo.lat},${geo.lon}`,
  );
}

function serializeEvent(event: NormalizedEvent) {
  const lines = [
    "BEGIN:VEVENT",
    writeProperty("UID", event.uid),
    writeProperty("DTSTAMP", formatUtc(new Date())),
    writeProperty("DTSTART", formatLocal(event.startAt), `TZID=${TIMEZONE}`),
  ];

  if (event.endAt) {
    lines.push(
      writeProperty("DTEND", formatLocal(event.endAt), `TZID=${TIMEZONE}`),
    );
  }

  if (event.recurrenceId) {
    lines.push(
      writeProperty(
        "RECURRENCE-ID",
        formatLocal(event.recurrenceId),
        `TZID=${TIMEZONE}`,
      ),
    );
  }

  lines.push(writeProperty("SUMMARY", escapeIcalText(event.title)));

  if (event.description) {
    lines.push(
      writeProperty("DESCRIPTION", escapeIcalText(event.description)),
    );
  }

  if (event.location) {
    lines.push(writeProperty("LOCATION", escapeIcalText(event.location)));
  }

  if (event.geo) {
    lines.push(writeGeo(event.geo));
  }

  if (event.structuredLocation) {
    lines.push(writeAppleStructuredLocation(event.structuredLocation));
  }

  if (event.url) {
    lines.push(writeProperty("URL", event.url));
  }

  lines.push(writeProperty("STATUS", mapDbStatus(event.status)));
  lines.push(writeProperty("SEQUENCE", String(event.sequence)));
  lines.push(writeProperty("LAST-MODIFIED", formatUtc(event.lastModified)));

  if (event.categories?.length) {
    lines.push(
      writeProperty("CATEGORIES", event.categories.map(escapeIcalText).join(",")),
    );
  }

  if (event.organizer) {
    lines.push(writeOrganizer(event.organizer));
  }

  if (event.icalData?.transparency) {
    lines.push(writeProperty("TRANSP", event.icalData.transparency));
  }

  if (event.recurrenceRule) {
    for (const line of event.recurrenceRule.split("\n")) {
      const trimmed = line.trim();
      if (
        trimmed.startsWith("RRULE:") ||
        trimmed.startsWith("EXDATE") ||
        trimmed.startsWith("RDATE")
      ) {
        lines.push(foldLine(trimmed));
      }
    }
  }

  lines.push("END:VEVENT");
  return lines.join("\r\n");
}

const PARIS_TIMEZONE_BLOCK = [
  "BEGIN:VTIMEZONE",
  "TZID:Europe/Paris",
  "BEGIN:DAYLIGHT",
  "TZOFFSETFROM:+0100",
  "TZOFFSETTO:+0200",
  "TZNAME:CEST",
  "DTSTART:19700329T020000",
  "RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU",
  "END:DAYLIGHT",
  "BEGIN:STANDARD",
  "TZOFFSETFROM:+0200",
  "TZOFFSETTO:+0100",
  "TZNAME:CET",
  "DTSTART:19701025T030000",
  "RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU",
  "END:STANDARD",
  "END:VTIMEZONE",
].join("\r\n");

export function serializeCalendar(
  events: NormalizedEvent[],
  meta: CalendarFeedMeta,
) {
  const timezone = meta.timezone ?? TIMEZONE;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    writeProperty("PRODID", meta.prodId),
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    writeProperty("X-WR-CALNAME", escapeIcalText(meta.name)),
    writeProperty("X-WR-TIMEZONE", timezone),
  ];

  if (meta.description) {
    lines.push(
      writeProperty("X-WR-CALDESC", escapeIcalText(meta.description)),
    );
  }

  if (timezone === TIMEZONE) {
    lines.push(PARIS_TIMEZONE_BLOCK);
  }

  for (const event of events) {
    lines.push(serializeEvent(event));
  }

  lines.push("END:VCALENDAR");
  return `${lines.join("\r\n")}\r\n`;
}

export { buildNormalizedEvent } from "./export-fields";
