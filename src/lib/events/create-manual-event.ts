import { eq } from "drizzle-orm";

import { db } from "@/db";
import { events, organizations } from "@/db/schema";
import type { AdminDataScope } from "@/lib/admin/data-scope";
import { resolveWritableOrganizationId } from "@/lib/admin/data-scope";
import { generateEventUid } from "@/lib/ical/uid";
import {
  resolveManualEventOrganizationId,
  resolveVenueFields,
} from "@/lib/events/manual-event-helpers";
import type { ManualEventWriteInput } from "@/lib/events/manual-event-schema";
import { getOrCreateManualSource } from "@/lib/events/manual-source";
import { upsertEventOverride } from "@/lib/events/overrides";
import type { EventOverridePatch } from "@/lib/events/overrides.types";
import { rebuildOccurrencesForMaster } from "@/lib/events/occurrence-projector";
import { resolveUniqueEventSlug } from "@/lib/events/resolve-unique-event-slug";
import { generateEventSlug } from "@/lib/slug";
import { eventUrl } from "@/lib/site";

async function resolveManualEventSlugPrefix(organizationId: string | null) {
  if (!organizationId) {
    return "manual";
  }

  const organization = await db.query.organizations.findFirst({
    where: eq(organizations.id, organizationId),
    columns: { slug: true },
  });

  return organization?.slug ?? "manual";
}

export async function createManualEvent(
  input: ManualEventWriteInput,
  dataScope: AdminDataScope,
) {
  const organizationId = await resolveManualEventOrganizationId(
    dataScope,
    input.organizationId,
  );

  const source = await getOrCreateManualSource(organizationId);
  const uid = generateEventUid();
  const now = new Date();
  const startAt = new Date(input.startAt);
  const endAt = input.endAt ? new Date(input.endAt) : null;
  const slugPrefix = await resolveManualEventSlugPrefix(organizationId);
  const baseSlug = generateEventSlug(
    `${slugPrefix}-${input.title}`,
    startAt,
  );
  const slug = await resolveUniqueEventSlug(baseSlug, uid);
  const { venueId, locationRaw } = await resolveVenueFields(input.venueId);

  const [event] = await db
    .insert(events)
    .values({
      sourceId: source.id,
      organizationId,
      venueId,
      uid,
      sourceUid: uid,
      slug,
      title: input.title,
      description: input.description,
      startAt,
      endAt,
      isAllDay: input.isAllDay,
      locationRaw,
      url: eventUrl(slug),
      sourceUrl: input.sourceUrl,
      status: input.status,
      categories: input.categories,
      recurrenceRule: input.recurrenceRule ?? null,
      confirmedAt: now,
      lastModified: now,
    })
    .returning();

  const patch: EventOverridePatch = {};

  if (input.offers !== undefined) {
    patch.offers = input.offers;
  }

  if (input.notes) {
    patch.notes = input.notes;
  }

  if (Object.keys(patch).length > 0) {
    await upsertEventOverride({
      eventId: event.id,
      patch,
    });
  }

  await rebuildOccurrencesForMaster(event.id);

  return event;
}
