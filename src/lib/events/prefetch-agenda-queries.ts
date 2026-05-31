import type { QueryClient } from "@tanstack/react-query";
import { toZonedTime } from "date-fns-tz";

import { getMonthGridBounds } from "@/lib/events/calendar";
import { getAgendaFilterOptions } from "@/lib/events/agenda-filter-options";
import {
  agendaFilterOptionsQueryKey,
  eventsRangeQueryKey,
} from "@/lib/events/event-query-options";
import { getUpcomingEvents } from "@/lib/events/queries";
import {
  PLANNING_EVENTS_LIMIT,
  getPlanningRange,
} from "@/lib/events/planning-range";
import { serializeOccurrence } from "@/lib/events/serialize";
import { siteConfig } from "@/lib/site";

async function loadEventsForRange(from: Date, to: Date, limit?: number) {
  const events = await getUpcomingEvents({ from, to, limit });
  return events.map(serializeOccurrence);
}

export async function prefetchAgendaQueries(queryClient: QueryClient) {
  const { from, to } = getPlanningRange();
  const now = toZonedTime(new Date(), siteConfig.timezone);
  const monthBounds = getMonthGridBounds(now);

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: eventsRangeQueryKey(from, to, PLANNING_EVENTS_LIMIT),
      queryFn: () => loadEventsForRange(from, to, PLANNING_EVENTS_LIMIT),
    }),
    queryClient.prefetchQuery({
      queryKey: agendaFilterOptionsQueryKey,
      queryFn: () => getAgendaFilterOptions(),
    }),
    queryClient.prefetchQuery({
      queryKey: eventsRangeQueryKey(monthBounds.from, monthBounds.to),
      queryFn: () => loadEventsForRange(monthBounds.from, monthBounds.to),
    }),
  ]);
}
