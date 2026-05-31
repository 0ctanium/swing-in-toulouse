import { addMonths, startOfDay } from "date-fns";
import { toZonedTime } from "date-fns-tz";

import { siteConfig } from "@/lib/site";

export const PLANNING_EVENTS_LIMIT = 20;
export const PLANNING_MONTHS_AHEAD = 6;

export function getPlanningRange() {
  const from = startOfDay(toZonedTime(new Date(), siteConfig.timezone));
  const to = addMonths(from, PLANNING_MONTHS_AHEAD);

  return {
    from,
    to,
    fromKey: from.toISOString(),
    toKey: to.toISOString(),
  };
}
