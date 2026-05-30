import type { EventOccurrence } from "@/lib/events/queries";

export type SerializableEventOccurrence = Omit<
  EventOccurrence,
  "startAt" | "endAt"
> & {
  startAt: string;
  endAt: string | null;
};

export function serializeOccurrence(
  event: EventOccurrence,
): SerializableEventOccurrence {
  return {
    ...event,
    startAt: event.startAt.toISOString(),
    endAt: event.endAt?.toISOString() ?? null,
  };
}

export function parseOccurrence(
  event: SerializableEventOccurrence,
): EventOccurrence {
  return {
    ...event,
    startAt: new Date(event.startAt),
    endAt: event.endAt ? new Date(event.endAt) : null,
  };
}

export function parseOccurrences(events: SerializableEventOccurrence[]) {
  return events.map(parseOccurrence);
}
