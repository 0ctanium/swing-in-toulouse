import { useQuery } from "@tanstack/react-query";
import { addMonths, startOfDay } from "date-fns";
import { toZonedTime } from "date-fns-tz";

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
): Promise<SerializableEventOccurrence[]> {
  const params = new URLSearchParams({
    from: from.toISOString(),
    to: to.toISOString(),
  });

  const response = await fetch(`/api/events?${params.toString()}`);

  if (!response.ok) {
    throw new Error("Impossible de charger les événements.");
  }

  const data = (await response.json()) as {
    events: SerializableEventOccurrence[];
  };

  return data.events;
}

export function useEvents(from: Date, to: Date, enabled = true) {
  const fromKey = from.toISOString();
  const toKey = to.toISOString();

  return useQuery({
    queryKey: ["events", fromKey, toKey],
    queryFn: () => fetchEvents(from, to),
    enabled,
    select: parseOccurrences,
  });
}

export function usePlanningEvents() {
  const from = getPlanningFromDate();
  const to = addMonths(from, 6);

  return useEvents(from, to);
}
