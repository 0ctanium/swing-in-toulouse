import { useQuery } from "@tanstack/react-query";

import {
  eventsRangeQueryOptions,
  planningEventsQueryOptions,
} from "@/lib/events/event-query-options";
import { parseOccurrences } from "@/lib/events/serialize";

export function useEvents(payload: {
  from: Date;
  to: Date;
  enabled?: boolean;
  limit?: number;
}) {
  const { from, to, enabled = true, limit } = payload;

  return useQuery({
    ...eventsRangeQueryOptions(from, to, limit),
    enabled,
    select: parseOccurrences,
  });
}

export function usePlanningEvents(limit?: number) {
  return useQuery({
    ...planningEventsQueryOptions(limit),
    select: parseOccurrences,
  });
}
