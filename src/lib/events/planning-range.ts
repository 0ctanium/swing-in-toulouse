import { addMonths, startOfDay } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";

import { siteConfig } from "@/lib/site";

export const PLANNING_EVENTS_LIMIT = 20;
export const PLANNING_MONTHS_AHEAD = 6;

export function getPlanningRange() {
  const now = toZonedTime(new Date(), siteConfig.timezone);
  const from = fromZonedTime(startOfDay(now), siteConfig.timezone);
  const to = fromZonedTime(
    startOfDay(addMonths(now, PLANNING_MONTHS_AHEAD)),
    siteConfig.timezone,
  );

  return {
    from,
    to,
    fromKey: from.toISOString(),
    toKey: to.toISOString(),
  };
}
