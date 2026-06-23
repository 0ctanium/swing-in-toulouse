import "server-only";

import type { QueryClient } from "@tanstack/react-query";
import { toZonedTime } from "date-fns-tz";

import { getEventsQueryEditKey } from "@/lib/admin/events-query-edit-key";
import { getMonthGridBounds } from "@/lib/events/calendar";
import { getAgendaFilterOptions } from "@/lib/events/agenda-filter-options";
import {
  agendaFilterOptionsQueryKey,
  eventsRangeQueryKey,
} from "@/lib/events/event-query-options";
import { loadPublicEventsForRange } from "@/lib/events/public-events-loader";
import {
  PLANNING_EVENTS_LIMIT,
  getPlanningRange,
} from "@/lib/events/planning-range";
import { siteConfig } from "@/lib/site";

export async function prefetchAgendaQueries(queryClient: QueryClient) {
  const editKey = await getEventsQueryEditKey();
  const { from, to } = getPlanningRange();
  const now = toZonedTime(new Date(), siteConfig.timezone);
  const monthBounds = getMonthGridBounds(now);

  await Promise.all([
    queryClient.prefetchQuery({
      queryKey: eventsRangeQueryKey(from, to, PLANNING_EVENTS_LIMIT, editKey),
      queryFn: () =>
        loadPublicEventsForRange(from, to, PLANNING_EVENTS_LIMIT),
    }),
    queryClient.prefetchQuery({
      queryKey: agendaFilterOptionsQueryKey,
      queryFn: () => getAgendaFilterOptions(),
    }),
    queryClient.prefetchQuery({
      queryKey: eventsRangeQueryKey(
        monthBounds.from,
        monthBounds.to,
        undefined,
        editKey,
      ),
      queryFn: () =>
        loadPublicEventsForRange(monthBounds.from, monthBounds.to),
    }),
  ]);
}
