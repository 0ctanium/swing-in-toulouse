import { useQuery } from "@tanstack/react-query";

import { fetchJson } from "@/lib/api/fetch-json";
import type { AgendaFilterOptions } from "@/lib/events/agenda-filter-options";

export const agendaFilterOptionsQueryKey = ["events", "filters"] as const;

async function fetchAgendaFilterOptions() {
  return fetchJson<AgendaFilterOptions>(
    "/api/events/filters",
    undefined,
    "Impossible de charger les filtres.",
  );
}

export function useAgendaFilterOptions() {
  return useQuery({
    queryKey: agendaFilterOptionsQueryKey,
    queryFn: fetchAgendaFilterOptions,
    staleTime: 5 * 60 * 1000,
  });
}
