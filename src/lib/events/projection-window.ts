import { addMonths } from "date-fns";

import { getArchiveLookbackStart } from "@/lib/events/hub";
import { getDefaultFromDate } from "@/lib/ical/recurrence";
import { env } from "@/env";

export type ProjectionWindow = {
  from: Date;
  to: Date;
};

export function getProjectionWindow(now = new Date()): ProjectionWindow {
  const monthsAhead = Number(env.PROJECTION_MONTHS_AHEAD) || 18;

  return {
    from: getArchiveLookbackStart(now),
    to: addMonths(getDefaultFromDate(now), monthsAhead),
  };
}
