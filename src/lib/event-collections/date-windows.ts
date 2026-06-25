import {
  addDays,
  endOfDay,
  endOfWeek,
  getDay,
  startOfDay,
  startOfWeek,
} from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";

import { siteConfig } from "@/lib/site";

export type DateWindow = {
  from: Date;
  to: Date;
};

function nowInSiteTimezone() {
  return toZonedTime(new Date(), siteConfig.timezone);
}

function toSiteWindow(start: Date, end: Date): DateWindow {
  return {
    from: fromZonedTime(startOfDay(start), siteConfig.timezone),
    to: fromZonedTime(endOfDay(end), siteConfig.timezone),
  };
}

export function getTodayWindow(now = nowInSiteTimezone()): DateWindow {
  return toSiteWindow(now, now);
}

/** Friday 00:00 through Sunday 23:59 in the site timezone. */
export function getThisWeekendWindow(now = nowInSiteTimezone()): DateWindow {
  const day = getDay(now);
  const dayStart = startOfDay(now);

  let fridayStart: Date;

  if (day === 0) {
    fridayStart = addDays(dayStart, -2);
  } else if (day >= 5) {
    fridayStart = day === 5 ? dayStart : addDays(dayStart, -1);
  } else {
    fridayStart = addDays(dayStart, 5 - day);
  }

  const sundayEnd = addDays(fridayStart, 2);

  return toSiteWindow(fridayStart, sundayEnd);
}

export function getThisWeekWindow(now = nowInSiteTimezone()): DateWindow {
  return toSiteWindow(
    startOfWeek(now, { weekStartsOn: 1 }),
    endOfWeek(now, { weekStartsOn: 1 }),
  );
}
