import { useQuery } from "@tanstack/react-query";

import { useEventsQueryEditKey } from "@/lib/admin/use-events-query-edit-key";
import {
  eventsRangeQueryOptions,
  planningEventsQueryOptions,
} from "@/lib/events/event-query-options";
import { PLANNING_EVENTS_LIMIT } from "@/lib/events/planning-range";
import { parseOccurrences } from "@/lib/events/serialize";

export function useEvents(payload: {
  from: Date;
  to: Date;
  enabled?: boolean;
  limit?: number;
}) {
  const { from, to, enabled = true, limit } = payload;
  const editKey = useEventsQueryEditKey();
  const resolvedEditKey = editKey === "loading" ? "none" : editKey;

  return useQuery({
    ...eventsRangeQueryOptions(from, to, limit, resolvedEditKey),
    enabled: enabled && editKey !== "loading",
    select: parseOccurrences,
  });
}

export function usePlanningEvents(limit = PLANNING_EVENTS_LIMIT) {
  const editKey = useEventsQueryEditKey();
  const resolvedEditKey = editKey === "loading" ? "none" : editKey;

  return useQuery({
    ...planningEventsQueryOptions(limit, resolvedEditKey),
    enabled: editKey !== "loading",
    select: parseOccurrences,
  });
}
