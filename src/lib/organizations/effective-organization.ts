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

/** Master events owned directly or assigned via override to this organization. */
export async function ownedMasterEventsWhere(organizationId: string) {
  const overriddenEventIds =
    await getEventIdsOverriddenToOrganization(organizationId);

  const ownershipFilter =
    overriddenEventIds.length > 0
      ? or(
          eq(events.organizationId, organizationId),
          inArray(events.id, overriddenEventIds),
        )
      : eq(events.organizationId, organizationId);

  return and(isNull(events.canonicalEventId), ownershipFilter);
}

export async function getEffectiveMasterOrganizationId(eventId: string) {
  const [event, override] = await Promise.all([
    db.query.events.findFirst({
      where: eq(events.id, eventId),
      columns: { id: true, organizationId: true },
    }),
    db.query.eventOverrides.findFirst({
      where: and(
        eq(eventOverrides.eventId, eventId),
        isNull(eventOverrides.occurrenceStartAt),
      ),
      columns: { patch: true },
    }),
  ]);

  if (!event) {
    return null;
  }

  const overrides = new Map<string, string | null>();
  if (override && override.patch.organizationId !== undefined) {
    overrides.set(eventId, override.patch.organizationId);
  }

  return effectiveOrganizationIdForEvent(event, overrides);
}

export async function fetchMastersForOrganization(
  organizationId: string,
  options?: { includeCancelled?: boolean },
) {
  const filters = [await ownedMasterEventsWhere(organizationId)];

  if (!options?.includeCancelled) {
    filters.push(eq(events.status, "published"));
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
