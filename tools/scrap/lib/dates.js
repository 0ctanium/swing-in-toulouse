(function initScrapDates(global) {
  const FR_MONTHS = {
    janv: 0,
    janvier: 0,
    fevr: 1,
    févr: 1,
    fevrier: 1,
    février: 1,
    fev: 1,
    mars: 2,
    mar: 2,
    avr: 3,
    avril: 3,
    mai: 4,
    juin: 5,
    juil: 6,
    juillet: 6,
    aout: 7,
    août: 7,
    sept: 8,
    septembre: 8,
    oct: 9,
    octobre: 9,
    nov: 10,
    novembre: 10,
    dec: 11,
    déc: 11,
    decembre: 11,
    décembre: 11,
  };

  const EN_MONTHS = {
    jan: 0,
    january: 0,
    feb: 1,
    february: 1,
    mar: 2,
    march: 2,
    apr: 3,
    april: 3,
    may: 4,
    jun: 5,
    june: 5,
    jul: 6,
    july: 6,
    aug: 7,
    august: 7,
    sep: 8,
    sept: 8,
    september: 8,
    oct: 9,
    october: 9,
    nov: 10,
    november: 10,
    dec: 11,
    december: 11,
  };

  /**
   * @param {string} isoDate YYYY-MM-DD
   */
  function parseIsoDateStartMs(isoDate) {
    return new Date(`${isoDate}T00:00:00`).getTime();
  }

  /**
   * @param {string} text
   */
  function parseEventDateText(text) {
    const normalized = text.trim().replace(/\s+/g, " ");
    if (!normalized) {
      return null;
    }

    const direct = Date.parse(normalized);
    if (!Number.isNaN(direct)) {
      return direct;
    }

    const numeric = normalized.match(
      /(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})(?:\D|$)/,
    );
    if (numeric) {
      const day = Number(numeric[1]);
      const month = Number(numeric[2]) - 1;
      let year = Number(numeric[3]);
      if (year < 100) {
        year += 2000;
      }
      return new Date(year, month, day).getTime();
    }

    const longMatch = normalized.match(
      /(\d{1,2})\s+([A-Za-zéû\.]+)\.?(?:\s+(\d{4}))?/,
    );
    if (longMatch) {
      const day = Number(longMatch[1]);
      const monthToken = longMatch[2].toLowerCase().replace(/\./g, "");
      const year = longMatch[3]
        ? Number(longMatch[3])
        : new Date().getFullYear();
      const month = FR_MONTHS[monthToken] ?? EN_MONTHS[monthToken];
      if (month !== undefined) {
        return new Date(year, month, day).getTime();
      }
    }

    const weekdayMatch = normalized.match(
      /[A-Za-zéèê]+\.?,?\s+([A-Za-zéû]+)\.?\s+(\d{1,2})(?:,?\s+(\d{4}))?/,
    );
    if (weekdayMatch) {
      const monthToken = weekdayMatch[1].toLowerCase().replace(/\./g, "");
      const day = Number(weekdayMatch[2]);
      const year = weekdayMatch[3]
        ? Number(weekdayMatch[3])
        : new Date().getFullYear();
      const month = FR_MONTHS[monthToken] ?? EN_MONTHS[monthToken];
      if (month !== undefined) {
        return new Date(year, month, day).getTime();
      }
    }

    return null;
  }

  /**
   * @param {ScrapFbEvent} event
   */
  function resolveEventStartMs(event) {
    if (typeof event.startTimestamp === "number") {
      return event.startTimestamp * 1000;
    }

    if (event.dateText) {
      const parsed = parseEventDateText(event.dateText);
      if (parsed !== null) {
        return parsed;
      }
    }

    return null;
  }

  /**
   * @param {ScrapFbEvent[]} events
   */
  function getOldestEventStartMs(events) {
    /** @type {number | null} */
    let oldest = null;

    for (const event of events) {
      const startMs = resolveEventStartMs(event);
      if (startMs === null) {
        continue;
      }
      if (oldest === null || startMs < oldest) {
        oldest = startMs;
      }
    }

    return oldest;
  }

  /**
   * @param {ScrapFbEvent} event
   * @param {string} isoDate
   */
  function isEventOnOrAfterDate(event, isoDate) {
    const startMs = resolveEventStartMs(event);
    if (startMs === null) {
      return true;
    }

    return startMs >= parseIsoDateStartMs(isoDate);
  }

  /**
   * @param {ScrapFbEvent[]} events
   * @param {string} isoDate
   */
  function hasEventsBeforeDate(events, isoDate) {
    const cutoffMs = parseIsoDateStartMs(isoDate);

    for (const event of events) {
      const startMs = resolveEventStartMs(event);
      if (startMs !== null && startMs < cutoffMs) {
        return true;
      }
    }

    return false;
  }

  /**
   * Stop when the oldest known event is before the cutoff, or any event is before it.
   * @param {ScrapFbEvent[]} events
   * @param {string} isoDate
   */
  function shouldStopPastScrape(events, isoDate) {
    if (!isoDate || events.length === 0) {
      return false;
    }

    const cutoffMs = parseIsoDateStartMs(isoDate);

    if (hasEventsBeforeDate(events, isoDate)) {
      return true;
    }

    const oldest = getOldestEventStartMs(events);
    if (oldest !== null && oldest < cutoffMs) {
      return true;
    }

    return false;
  }

  /**
   * @param {ScrapFbEvent[]} events
   * @param {string | null | undefined} isoDate
   */
  function filterEventsOnOrAfterDate(events, isoDate) {
    if (!isoDate) {
      return events;
    }

    return events.filter((event) => isEventOnOrAfterDate(event, isoDate));
  }

  function defaultPastMaxDate() {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 1);
    return formatIsoDate(date);
  }

  /**
   * @param {Date} date
   */
  function formatIsoDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  /**
   * Whether an event is upcoming, based on start time (not Facebook's isPast).
   * @param {ScrapFbEvent} event
   * @param {number} [nowSec]
   * @returns {boolean | null} null when the start time is unknown
   */
  function isEventUpcoming(event, nowSec = Math.floor(Date.now() / 1000)) {
    if (typeof event.startTimestamp === "number") {
      return event.startTimestamp > nowSec;
    }

    const startMs = resolveEventStartMs(event);
    if (startMs !== null) {
      return startMs > nowSec * 1000;
    }

    return null;
  }

  /**
   * @param {ScrapFbEvent[]} events
   * @param {number} [nowSec]
   */
  function countUpcomingEvents(events, nowSec = Math.floor(Date.now() / 1000)) {
    let count = 0;

    for (const event of events) {
      if (isEventUpcoming(event, nowSec) === true) {
        count++;
      }
    }

    return count;
  }

  global.ScrapExt = global.ScrapExt || {};
  global.ScrapExt.parseEventDateText = parseEventDateText;
  global.ScrapExt.resolveEventStartMs = resolveEventStartMs;
  global.ScrapExt.getOldestEventStartMs = getOldestEventStartMs;
  global.ScrapExt.isEventOnOrAfterDate = isEventOnOrAfterDate;
  global.ScrapExt.hasEventsBeforeDate = hasEventsBeforeDate;
  global.ScrapExt.shouldStopPastScrape = shouldStopPastScrape;
  global.ScrapExt.filterEventsOnOrAfterDate = filterEventsOnOrAfterDate;
  global.ScrapExt.defaultPastMaxDate = defaultPastMaxDate;
  global.ScrapExt.formatIsoDate = formatIsoDate;
  global.ScrapExt.isEventUpcoming = isEventUpcoming;
  global.ScrapExt.countUpcomingEvents = countUpcomingEvents;
})(globalThis);
