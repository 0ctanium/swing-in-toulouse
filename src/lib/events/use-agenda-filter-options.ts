import { useQuery } from "@tanstack/react-query";

import {
  agendaFilterOptionsQueryOptions,
} from "@/lib/events/event-query-options";

export { agendaFilterOptionsQueryKey } from "@/lib/events/event-query-options";

export function useAgendaFilterOptions() {
  return useQuery({
    ...agendaFilterOptionsQueryOptions(),
    staleTime: 5 * 60 * 1000,
  });
}
