import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { eventOverrides, events } from "@/db/schema";
import type { AdminDataScope } from "@/lib/admin/data-scope";
import {
  loadManualEvent,
  resolveManualEventOrganizationId,
  resolveVenueFields,
} from "@/lib/events/manual-event-helpers";
import type { ManualEventWriteInput } from "@/lib/events/manual-event-schema";
import { getOrCreateManualSource } from "@/lib/events/manual-source";
import type { EventOverridePatch } from "@/lib/events/overrides.types";
import { rebuildOccurrencesForMaster } from "@/lib/events/occurrence-projector";

async function syncManualEventOverride(
  eventId: string,
  input: Pick<ManualEventWriteInput, "offers" | "notes">,
) {
  const existing = await db.query.eventOverrides.findFirst({
    where: and(
      eq(eventOverrides.eventId, eventId),
      isNull(eventOverrides.occurrenceStartAt),
    ),
  });

  const patch: EventOverridePatch = { ...(existing?.patch ?? {}) };

  if (input.offers !== undefined) {
    patch.offers = input.offers;
  }

  if (input.notes !== undefined) {
    patch.notes = input.notes;
  }

  const keepOverride =
    patch.offers !== undefined || Boolean(patch.notes?.trim());

  if (!keepOverride) {
    if (existing) {
      await db.delete(eventOverrides).where(eq(eventOverrides.id, existing.id));
    }
    return;
  }

  if (existing) {
    await db
      .update(eventOverrides)
      .set({
        patch,
        notes: patch.notes ?? null,
      })
      .where(eq(eventOverrides.id, existing.id));
    return;
  }

  await db.insert(eventOverrides).values({
    eventId,
    occurrenceStartAt: null,
    patch,
    notes: patch.notes ?? null,
  });
}

export async function updateManualEvent(
  eventId: string,
  input: ManualEventWriteInput,
  dataScope: AdminDataScope,
) {
  await loadManualEvent(eventId);

  const organizationId = await resolveManualEventOrganizationId(
    dataScope,
    input.organizationId,
  );
  const source = await getOrCreateManualSource(organizationId);
  const startAt = new Date(input.startAt);
  const endAt = input.endAt ? new Date(input.endAt) : null;
  const { venueId, locationRaw } = await resolveVenueFields(input.venueId);
  const now = new Date();

  const [updated] = await db
    .update(events)
    .set({
      sourceId: source.id,
      organizationId,
      venueId,
      title: input.title,
      description: input.description,
      startAt,
      endAt,
      isAllDay: input.isAllDay,
      locationRaw,
      sourceUrl: input.sourceUrl,
      status: input.status,
      categories: input.categories,
      lastModified: now,
    })
    .where(eq(events.id, eventId))
    .returning();

  await syncManualEventOverride(eventId, {
    offers: input.offers,
    notes: input.notes,
  });
  await rebuildOccurrencesForMaster(eventId);

  return updated;
}

export async function cancelManualEvent(eventId: string) {
  await loadManualEvent(eventId);

  const now = new Date();
  const [updated] = await db
    .update(events)
    .set({
      status: "cancelled",
      lastModified: now,
    })
    .where(eq(events.id, eventId))
    .returning();

  await rebuildOccurrencesForMaster(eventId);

  return updated;
}

export async function deleteManualEvent(eventId: string) {
  await loadManualEvent(eventId);

  const [deleted] = await db
    .delete(events)
    .where(eq(events.id, eventId))
    .returning({ id: events.id });

  return deleted;
}
