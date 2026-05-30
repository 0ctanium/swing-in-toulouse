import { useQuery } from "@tanstack/react-query";
import { addMonths, startOfDay } from "date-fns";
import { toZonedTime } from "date-fns-tz";

import { fetchJson } from "@/lib/api/fetch-json";
import { eventsQueryKeys } from "@/lib/admin/query-keys";
import {
  parseOccurrences,
  type SerializableEventOccurrence,
} from "@/lib/events/serialize";
import { siteConfig } from "@/lib/site";

function getPlanningFromDate() {
  return startOfDay(toZonedTime(new Date(), siteConfig.timezone));
}

async function fetchEvents(
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

export function useEvents(payload: {
  from: Date;
  to: Date;
  enabled?: boolean;
  limit?: number;
}) {
  const { from, to, enabled = true, limit } = payload;

  const fromKey = from.toISOString();
  const toKey = to.toISOString();

  return useQuery({
    queryKey: eventsQueryKeys.range(fromKey, toKey, limit),
    queryFn: () => fetchEvents(from, to, limit),
    enabled,
    select: parseOccurrences,
  });
}

export function usePlanningEvents(limit: number = 20) {
  const from = getPlanningFromDate();
  const to = addMonths(from, 6);

  return useEvents({ from, to, limit });
}
