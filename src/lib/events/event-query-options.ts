import { fetchJson } from "@/lib/api/fetch-json";
import { eventsQueryKeys } from "@/lib/admin/query-keys";
import type { AgendaFilterOptions } from "@/lib/events/agenda-filter-options";
import {
  PLANNING_EVENTS_LIMIT,
  getPlanningRange,
} from "@/lib/events/planning-range";
import type { SerializableEventOccurrence } from "@/lib/events/serialize";

export const agendaFilterOptionsQueryKey = ["events", "filters"] as const;

export async function fetchEventsForRange(
  from: Date,
  to: Date,
  limit?: number,
): Promise<SerializableEventOccurrence[]> {
  const params = new URLSearchParams({
    from: from.toISOString(),
    to: to.toISOString(),
  });

  if (limit) {
    params.set("limit", limit.toString());
  }

  const data = await fetchJson<{ events: SerializableEventOccurrence[] }>(
    `/api/events?${params.toString()}`,
    undefined,
    "Impossible de charger les événements.",
  );

  return data.events;
}

async function fetchAgendaFilterOptions(): Promise<AgendaFilterOptions> {
  return fetchJson<AgendaFilterOptions>(
    "/api/events/filters",
    undefined,
    "Impossible de charger les filtres.",
  );
}

export function eventsRangeQueryKey(from: Date, to: Date, limit?: number) {
  return eventsQueryKeys.range(from.toISOString(), to.toISOString(), limit);
}

export function eventsRangeQueryOptions(from: Date, to: Date, limit?: number) {
  return {
    queryKey: eventsRangeQueryKey(from, to, limit),
    queryFn: () => fetchEventsForRange(from, to, limit),
  };
}

export function planningEventsQueryOptions(limit = PLANNING_EVENTS_LIMIT) {
  const { from, to } = getPlanningRange();

  return eventsRangeQueryOptions(from, to, limit);
}

export function agendaFilterOptionsQueryOptions() {
  return {
    queryKey: agendaFilterOptionsQueryKey,
    queryFn: fetchAgendaFilterOptions,
  };
}
