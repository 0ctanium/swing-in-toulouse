/**
 * Minimal iCal serializer for Facebook group exports.
 * Mirrors Swing in Toulouse feed conventions (Europe/Paris, PRODID, VTIMEZONE).
 *
 * @typedef {Object} ScrapFbEvent
 * @property {string} id
 * @property {string} name
 * @property {string} url
 * @property {string | null} dateText
 * @property {number | null} startTimestamp
 * @property {number | null} endTimestamp
 * @property {boolean} isCanceled
 * @property {boolean} isPast
 * @property {string | null} [description]
 * @property {ScrapFbLocation | null} [location]
 * @property {boolean} [isOnline]
 * @property {{ url?: string | null; type?: string | null } | null} [onlineDetails]
 * @property {string | null} [timezone]
 * @property {string | null} [detailsFetchedAt]
 *
 * @typedef {Object} ScrapFbLocation
 * @property {string | null} [name]
 * @property {string | null} [address]
 * @property {string | null} [description]
 * @property {{ latitude: number; longitude: number } | null} [coordinates]
 * @property {{ name?: string } | null} [city]
 */
(function initScrapIcs(global) {
  const TIMEZONE = "Europe/Paris";

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

  function sanitizeUnicode(value) {
    let output = "";

    for (let i = 0; i < value.length; i++) {
      const code = value.charCodeAt(i);

      if (code >= 0xd800 && code <= 0xdbff) {
        const next = value.charCodeAt(i + 1);
        if (next >= 0xdc00 && next <= 0xdfff) {
          output += value[i] + value[i + 1];
          i++;
        }
        continue;
      }

      if (code >= 0xdc00 && code <= 0xdfff) {
        continue;
      }

      output += value[i];
    }

    return output;
  }

  function escapeIcalText(value) {
    return sanitizeUnicode(value)
      .replace(/\\/g, "\\\\")
      .replace(/\n/g, "\\n")
      .replace(/;/g, "\\;")
      .replace(/,/g, "\\,");
  }

  function foldLine(line) {
    const maxLength = 75;
    if (line.length <= maxLength) {
      return line;
    }

    const chunks = [line.slice(0, maxLength)];
    let remaining = line.slice(maxLength);

    while (remaining.length > 0) {
      chunks.push(` ${remaining.slice(0, maxLength - 1)}`);
      remaining = remaining.slice(maxLength - 1);
    }

    return chunks.join("\r\n");
  }

  function writeProperty(name, value, params) {
    const key = params ? `${name};${params}` : name;
    return foldLine(`${key}:${value}`);
  }

  function formatUtc(date) {
    return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  }

  function formatLocalInParis(date) {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).formatToParts(date);

    const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return `${lookup.year}${lookup.month}${lookup.day}T${lookup.hour}${lookup.minute}${lookup.second}`;
  }

  /**
   * @param {ScrapFbEvent} event
   */
  function formatLocation(event) {
    if (event.isOnline && event.onlineDetails?.url) {
      return event.onlineDetails.url;
    }

    const location = event.location;
    if (!location) {
      return null;
    }

    const parts = [];
    if (location.name) {
      parts.push(location.name);
    }
    if (location.address) {
      parts.push(location.address);
    }
    if (location.city?.name) {
      parts.push(location.city.name);
    }

    return parts.length > 0 ? parts.join(", ") : null;
  }

  /**
   * @param {ScrapFbEvent} event
   */
  function formatGeo(event) {
    const coords = event.location?.coordinates;
    if (
      coords?.latitude == null ||
      coords?.longitude == null ||
      Number.isNaN(coords.latitude) ||
      Number.isNaN(coords.longitude)
    ) {
      return null;
    }

    return `${coords.latitude};${coords.longitude}`;
  }

  /**
   * @param {ScrapFbEvent} event
   */
  function resolveStartDate(event) {
    if (event.startTimestamp) {
      return new Date(event.startTimestamp * 1000);
    }

    if (event.dateText) {
      const parsed = Date.parse(event.dateText);
      if (!Number.isNaN(parsed)) {
        return new Date(parsed);
      }
    }

    return null;
  }

  /**
   * @param {ScrapFbEvent} event
   */
  function resolveEndDate(event, startDate) {
    if (event.endTimestamp) {
      return new Date(event.endTimestamp * 1000);
    }

    if (startDate) {
      return new Date(startDate.getTime() + 2 * 60 * 60 * 1000);
    }

    return null;
  }

  /**
   * @param {ScrapFbEvent} event
   */
  function serializeEvent(event) {
    const now = new Date();
    const startDate = resolveStartDate(event);
    const endDate = startDate ? resolveEndDate(event, startDate) : null;

    const lines = [
      "BEGIN:VEVENT",
      writeProperty("UID", `fb-${event.id}@facebook.com`),
      writeProperty("DTSTAMP", formatUtc(now)),
    ];

    if (startDate) {
      lines.push(
        writeProperty(
          "DTSTART",
          formatLocalInParis(startDate),
          `TZID=${TIMEZONE}`,
        ),
      );
    }

    if (endDate) {
      lines.push(
        writeProperty("DTEND", formatLocalInParis(endDate), `TZID=${TIMEZONE}`),
      );
    }

    lines.push(writeProperty("SUMMARY", escapeIcalText(event.name)));

    const descriptionParts = [];
    if (event.description) {
      descriptionParts.push(event.description);
    } else if (event.dateText) {
      descriptionParts.push(event.dateText);
    }
    descriptionParts.push(`Imported from Facebook: ${event.url}`);

    lines.push(
      writeProperty("DESCRIPTION", escapeIcalText(descriptionParts.join("\n"))),
    );

    const locationLabel = formatLocation(event);
    if (locationLabel) {
      lines.push(writeProperty("LOCATION", escapeIcalText(locationLabel)));
    }

    const geo = formatGeo(event);
    if (geo) {
      lines.push(writeProperty("GEO", geo));
    }

    lines.push(writeProperty("URL", event.url));
    lines.push(
      writeProperty("STATUS", event.isCanceled ? "CANCELLED" : "CONFIRMED"),
    );
    lines.push(writeProperty("SEQUENCE", "0"));
    lines.push(writeProperty("LAST-MODIFIED", formatUtc(now)));
    lines.push("END:VEVENT");

    return lines.join("\r\n");
  }

  /**
   * @param {ScrapFbEvent[]} events
   * @param {{ name: string; description?: string; groupId?: string | null }} meta
   */
  function buildCalendar(events, meta) {
    const calName = meta.name || "Facebook group events";
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      writeProperty("PRODID", "-//Swing in Toulouse//FB Group Export//FR"),
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      writeProperty("X-WR-CALNAME", escapeIcalText(calName)),
      writeProperty("X-WR-TIMEZONE", TIMEZONE),
    ];

    if (meta.description) {
      lines.push(
        writeProperty("X-WR-CALDESC", escapeIcalText(meta.description)),
      );
    }

    lines.push(PARIS_TIMEZONE_BLOCK);

    for (const event of events) {
      lines.push(serializeEvent(event));
    }

    lines.push("END:VCALENDAR");
    return `${lines.join("\r\n")}\r\n`;
  }

  global.ScrapExt = global.ScrapExt || {};
  global.ScrapExt.buildCalendar = buildCalendar;
})(globalThis);
