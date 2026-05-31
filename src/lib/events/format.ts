import { addDays, format } from "date-fns";
import { formatInTimeZone, toZonedTime } from "date-fns-tz";
import { fr } from "date-fns/locale";

import { siteConfig } from "@/lib/site";

const TIMEZONE = siteConfig.timezone;

export const ALL_DAY_LABEL = "Jour entier";

export function calendarDayKey(date: Date) {
  return formatInTimeZone(date, TIMEZONE, "yyyy-MM-dd");
}

function isMidnightInSiteTimezone(date: Date) {
  return formatInTimeZone(date, TIMEZONE, "HH:mm:ss") === "00:00:00";
}

export function isAllDayEvent(
  startAt: Date,
  endAt: Date | null,
  isAllDay = false,
) {
  if (isAllDay) {
    return true;
  }
  if (!isMidnightInSiteTimezone(startAt)) {
    return false;
  }

  if (!endAt) {
    return false;
  }

  if (!isMidnightInSiteTimezone(endAt)) {
    return false;
  }

  const startDay = calendarDayKey(startAt);
  const endDay = calendarDayKey(endAt);

  if (startDay === endDay) {
    return true;
  }

  return endAt > startAt;
}

function getAllDayInclusiveEnd(startAt: Date, endAt: Date) {
  const startDay = calendarDayKey(startAt);
  const endDay = calendarDayKey(endAt);

  if (startDay === endDay) {
    return toZonedTime(startAt, TIMEZONE);
  }

  return addDays(toZonedTime(endAt, TIMEZONE), -1);
}

export function getEventInclusiveCalendarDay(
  startAt: Date,
  endAt: Date | null,
  isAllDay = false,
) {
  if (!endAt) {
    return calendarDayKey(startAt);
  }

  if (isAllDayEvent(startAt, endAt, isAllDay)) {
    return calendarDayKey(getAllDayInclusiveEnd(startAt, endAt));
  }

  return calendarDayKey(endAt);
}

function formatAllDayEventDate(startAt: Date, endAt: Date) {
  const startZoned = toZonedTime(startAt, TIMEZONE);
  const endInclusive = getAllDayInclusiveEnd(startAt, endAt);
  const startDay = calendarDayKey(startAt);
  const endInclusiveDay = calendarDayKey(endInclusive);

  if (startDay === endInclusiveDay) {
    return `${format(startZoned, "EEEE d MMMM yyyy", { locale: fr })} · ${ALL_DAY_LABEL}`;
  }

  const sameYear =
    format(startZoned, "yyyy") === format(endInclusive, "yyyy");

  const endPattern = sameYear ? "EEEE d MMMM" : "EEEE d MMMM yyyy";

  return `${format(startZoned, "EEEE d MMMM", { locale: fr })} – ${format(endInclusive, endPattern, { locale: fr })} · ${ALL_DAY_LABEL}`;
}

export function formatEventDate(
  startAt: Date,
  endAt: Date | null,
  isAllDay = false,
) {
  if (endAt && isAllDayEvent(startAt, endAt, isAllDay)) {
    return formatAllDayEventDate(startAt, endAt);
  }

  const startZoned = toZonedTime(startAt, TIMEZONE);
  const startLabel = format(startZoned, "EEEE d MMMM yyyy · HH:mm", {
    locale: fr,
  });

  if (!endAt) {
    return startLabel;
  }

  const endZoned = toZonedTime(endAt, TIMEZONE);
  const sameDay = calendarDayKey(startAt) === calendarDayKey(endAt);

  if (sameDay) {
    return `${startLabel} – ${format(endZoned, "HH:mm", { locale: fr })}`;
  }

  return `${startLabel} → ${format(endZoned, "EEEE d MMMM · HH:mm", { locale: fr })}`;
}

export function formatEventChipTime(
  startAt: Date,
  endAt: Date | null,
  isAllDay = false,
) {
  if (isAllDayEvent(startAt, endAt, isAllDay)) {
    return null;
  }

  return format(toZonedTime(startAt, TIMEZONE), "HH:mm", { locale: fr });
}

export function formatEventScheduleTime(
  startAt: Date,
  endAt: Date | null,
  isAllDay = false,
) {
  if (isAllDayEvent(startAt, endAt, isAllDay)) {
    return ALL_DAY_LABEL;
  }

  const startTime = format(toZonedTime(startAt, TIMEZONE), "HH:mm", {
    locale: fr,
  });

  if (!endAt) {
    return startTime;
  }

  const endTime = format(toZonedTime(endAt, TIMEZONE), "HH:mm", { locale: fr });
  return `De ${startTime} à ${endTime}`;
}
