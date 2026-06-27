import { addDays, subDays } from "date-fns";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

import { siteConfig } from "@/lib/site";

const TIMEZONE = siteConfig.timezone;

export type EventScheduleValue = {
  isAllDay: boolean;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
};

export function defaultEventScheduleValue(now = new Date()): EventScheduleValue {
  const today = formatInTimeZone(now, TIMEZONE, "yyyy-MM-dd");

  return {
    isAllDay: false,
    startDate: today,
    startTime: "20:00",
    endDate: today,
    endTime: "23:00",
  };
}

export function scheduleValueFromEvent(event: {
  startAt: Date;
  endAt: Date | null;
  isAllDay: boolean;
}): EventScheduleValue {
  if (event.isAllDay) {
    const startDate = formatInTimeZone(event.startAt, TIMEZONE, "yyyy-MM-dd");
    const endDate = event.endAt
      ? formatInTimeZone(subDays(event.endAt, 1), TIMEZONE, "yyyy-MM-dd")
      : startDate;

    return {
      isAllDay: true,
      startDate,
      startTime: "00:00",
      endDate,
      endTime: "00:00",
    };
  }

  const endAt = event.endAt ?? event.startAt;

  return {
    isAllDay: false,
    startDate: formatInTimeZone(event.startAt, TIMEZONE, "yyyy-MM-dd"),
    startTime: formatInTimeZone(event.startAt, TIMEZONE, "HH:mm"),
    endDate: formatInTimeZone(endAt, TIMEZONE, "yyyy-MM-dd"),
    endTime: formatInTimeZone(endAt, TIMEZONE, "HH:mm"),
  };
}

export function buildScheduleIso(value: EventScheduleValue) {
  if (value.isAllDay) {
    const startAt = fromZonedTime(`${value.startDate}T00:00:00`, TIMEZONE);
    const endDay = value.endDate || value.startDate;
    const endAtBase = fromZonedTime(`${endDay}T00:00:00`, TIMEZONE);
    const startKey = formatInTimeZone(startAt, TIMEZONE, "yyyy-MM-dd");
    const endKey = formatInTimeZone(endAtBase, TIMEZONE, "yyyy-MM-dd");
    const endAt =
      startKey === endKey ? addDays(startAt, 1) : addDays(endAtBase, 1);

    return {
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
      isAllDay: true,
    };
  }

  const startAt = fromZonedTime(
    `${value.startDate}T${value.startTime}:00`,
    TIMEZONE,
  );
  const endAt = fromZonedTime(`${value.endDate}T${value.endTime}:00`, TIMEZONE);

  if (endAt < startAt) {
    throw new Error("La fin doit être postérieure au début.");
  }

  return {
    startAt: startAt.toISOString(),
    endAt: endAt.toISOString(),
    isAllDay: false,
  };
}
