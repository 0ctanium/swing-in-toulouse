import type { EventOccurrence } from "@/lib/events/queries";
import type { AdminEventMeta } from "@/lib/events/admin-meta";

export type SerializableEventOccurrence = Omit<
  EventOccurrence,
  "startAt" | "endAt"
> & {
  startAt: string;
  endAt: string | null;
  admin?: AdminEventMeta;
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
): EventOccurrence & { admin?: AdminEventMeta } {
  return {
    ...event,
    startAt: new Date(event.startAt),
    endAt: event.endAt ? new Date(event.endAt) : null,
  };
}

export function parseOccurrences(events: SerializableEventOccurrence[]) {
  return events.map(parseOccurrence);
}
