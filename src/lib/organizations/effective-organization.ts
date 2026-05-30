import { isNull } from "drizzle-orm";

import { db } from "@/db";
import { eventOverrides, events } from "@/db/schema";

export function effectiveOrganizationIdForEvent(
  event: { id: string; organizationId: string | null },
  overrides: Map<string, string | null>,
) {
  if (overrides.has(event.id)) {
    return overrides.get(event.id) ?? null;
  }

  return event.organizationId;
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
