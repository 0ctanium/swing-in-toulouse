import { and, eq, inArray, isNull, or } from "drizzle-orm";

import { db } from "@/db";
import { eventOverrides, events } from "@/db/schema";
import type { EventMaster } from "@/db/schema";
import type { EventOccurrence } from "@/lib/ical/recurrence";

export function effectiveOrganizationIdForEvent(
  event: { id: string; organizationId: string | null },
  overrides: Map<string, string | null>,
) {
  if (overrides.has(event.id)) {
    return overrides.get(event.id) ?? null;
  }

  return event.organizationId;
}

export async function getEventIdsOverriddenToOrganization(
  organizationId: string,
) {
  const rows = await db.query.eventOverrides.findMany({
    columns: { eventId: true, patch: true },
  });

  const eventIds = new Set<string>();
  for (const row of rows) {
    if (row.patch.organizationId === organizationId) {
      eventIds.add(row.eventId);
    }
  }

  return [...eventIds];
}

export async function fetchMastersForOrganization(
  organizationId: string,
  options?: { includeCancelled?: boolean },
) {
  const overriddenEventIds =
    await getEventIdsOverriddenToOrganization(organizationId);

  const filters = [isNull(events.canonicalEventId)];

  if (!options?.includeCancelled) {
    filters.push(eq(events.status, "published"));
  }

  if (overriddenEventIds.length > 0) {
    filters.push(
      or(
        eq(events.organizationId, organizationId),
        inArray(events.id, overriddenEventIds),
      )!,
    );
  } else {
    filters.push(eq(events.organizationId, organizationId));
  }

  return db.query.events.findMany({
    where: and(...filters),
    with: {
      source: true,
      organization: true,
      venue: true,
    },
    orderBy: (eventsTable, { asc }) => [asc(eventsTable.startAt)],
  }) as Promise<EventMaster[]>;
}

export function filterOccurrencesForOrganization(
  occurrences: EventOccurrence[],
  organizationId: string,
) {
  return occurrences.filter(
    (occurrence) => occurrence.organization?.id === organizationId,
  );
}

export async function computeEffectiveOrganizationEventCounts() {
  const [eventRows, overrideRows] = await Promise.all([
    db.query.events.findMany({
      where: isNull(events.canonicalEventId),
      columns: { id: true, organizationId: true },
    }),
    db.query.eventOverrides.findMany({
      where: isNull(eventOverrides.occurrenceStartAt),
      columns: { eventId: true, patch: true },
    }),
  ]);

  const overrides = new Map<string, string | null>();
  for (const row of overrideRows) {
    if (row.patch.organizationId !== undefined) {
      overrides.set(row.eventId, row.patch.organizationId);
    }
  }

  const counts = new Map<string, number>();
  for (const event of eventRows) {
    const effectiveOrganizationId = effectiveOrganizationIdForEvent(
      event,
      overrides,
    );
    if (!effectiveOrganizationId) {
      continue;
    }

    counts.set(
      effectiveOrganizationId,
      (counts.get(effectiveOrganizationId) ?? 0) + 1,
    );
  }

  return counts;
}
