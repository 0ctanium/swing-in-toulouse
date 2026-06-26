import "server-only";

import type { QueryClient } from "@tanstack/react-query";

import { getEventsQueryEditKey } from "@/lib/admin/events-query-edit-key";
import type { AgendaPreferences } from "@/lib/events/agenda-preferences";
import { getAgendaFilterOptions } from "@/lib/events/agenda-filter-options";
import {
  getAgendaCalendarAnchor,
  getFourWeekGridBounds,
  getMonthGridBounds,
} from "@/lib/events/calendar";
import {
  agendaFilterOptionsQueryKey,
  eventsRangeQueryKey,
} from "@/lib/events/event-query-options";
import { loadPublicEventsForRange } from "@/lib/events/public-events-loader";
import {
  PLANNING_EVENTS_LIMIT,
  getPlanningRange,
} from "@/lib/events/planning-range";

export async function prefetchAgendaQueries(
  queryClient: QueryClient,
  preferences: AgendaPreferences,
) {
  const editKey = await getEventsQueryEditKey();
  const prefetches: Array<Promise<unknown>> = [
    queryClient.prefetchQuery({
      queryKey: agendaFilterOptionsQueryKey,
      queryFn: () => getAgendaFilterOptions(),
    }),
  ];

  if (preferences.viewMode === "planning") {
    const { from, to } = getPlanningRange();
    prefetches.push(
      queryClient.prefetchQuery({
        queryKey: eventsRangeQueryKey(from, to, PLANNING_EVENTS_LIMIT, editKey),
        queryFn: () =>
          loadPublicEventsForRange(from, to, PLANNING_EVENTS_LIMIT),
      }),
    );
  } else {
    const anchor = getAgendaCalendarAnchor();
    const bounds =
      preferences.agendaMode === "4-weeks"
        ? getFourWeekGridBounds(anchor)
        : getMonthGridBounds(anchor);

    prefetches.push(
      queryClient.prefetchQuery({
        queryKey: eventsRangeQueryKey(
          bounds.from,
          bounds.to,
          undefined,
          editKey,
        ),
        queryFn: () => loadPublicEventsForRange(bounds.from, bounds.to),
      }),
    );
  }

  return await Promise.all(prefetches);
}
