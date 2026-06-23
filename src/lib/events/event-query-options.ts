import { fetchJson } from "@/lib/api/fetch-json";
import type { EventsQueryEditKey } from "@/lib/admin/events-query-edit-key.types";
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
    { credentials: "same-origin" },
    "Impossible de charger les événements.",
  );

  return data.events;
}

async function fetchAgendaFilterOptions(): Promise<AgendaFilterOptions> {
  return fetchJson<AgendaFilterOptions>(
    "/api/events/filters",
    { credentials: "same-origin" },
    "Impossible de charger les filtres.",
  );
}

export function eventsRangeQueryKey(
  from: Date,
  to: Date,
  limit: number | undefined,
  editKey: Exclude<EventsQueryEditKey, "loading">,
) {
  return eventsQueryKeys.range(
    from.toISOString(),
    to.toISOString(),
    limit,
    editKey,
  );
}

export function eventsRangeQueryOptions(
  from: Date,
  to: Date,
  limit: number | undefined,
  editKey: Exclude<EventsQueryEditKey, "loading">,
) {
  return {
    queryKey: eventsRangeQueryKey(from, to, limit, editKey),
    queryFn: () => fetchEventsForRange(from, to, limit),
  };
}

export function planningEventsQueryOptions(
  limit: number | undefined,
  editKey: Exclude<EventsQueryEditKey, "loading">,
) {
  const { from, to } = getPlanningRange();

  return eventsRangeQueryOptions(from, to, limit, editKey);
}

export function agendaFilterOptionsQueryOptions() {
  return {
    queryKey: agendaFilterOptionsQueryKey,
    queryFn: fetchAgendaFilterOptions,
  };
}
