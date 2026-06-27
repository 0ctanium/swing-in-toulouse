import { eq } from "drizzle-orm";

import { db } from "@/db";
import { events, organizations, venues } from "@/db/schema";
import type { AdminDataScope } from "@/lib/admin/data-scope";
import { resolveWritableOrganizationId } from "@/lib/admin/data-scope";
import { generateEventUid } from "@/lib/ical/uid";
import { rebuildOccurrencesForMaster } from "@/lib/events/occurrence-projector";
import { getOrCreateManualSource } from "@/lib/events/manual-source";
import type { ManualEventWriteInput } from "@/lib/events/manual-event-schema";
import { upsertEventOverride } from "@/lib/events/overrides";
import type { EventOverridePatch } from "@/lib/events/overrides.types";
import { resolveUniqueEventSlug } from "@/lib/events/resolve-unique-event-slug";
import { generateEventSlug } from "@/lib/slug";
import { formatVenueAsDefaultLocation } from "@/lib/sources/defaults";
import { getOrganizationById } from "@/lib/sources/admin";
import { eventUrl } from "@/lib/site";
import { resolveVenueForSync } from "@/lib/venues/canonical";

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

async function resolveVenueFields(venueId: string | null) {
  if (!venueId) {
    return { venueId: null, locationRaw: null };
  }

  const venue = await db.query.venues.findFirst({
    where: eq(venues.id, venueId),
  });

  if (!venue) {
    throw new Error("Lieu introuvable.");
  }

  const resolved = await resolveVenueForSync(venue);

  return {
    venueId: resolved?.id ?? venue.id,
    locationRaw: formatVenueAsDefaultLocation(resolved ?? venue),
  };
}

export async function createManualEvent(
  input: ManualEventWriteInput,
  dataScope: AdminDataScope,
) {
  const organizationId = resolveWritableOrganizationId(
    dataScope,
    input.organizationId,
  );

  if (organizationId) {
    const organization = await getOrganizationById(organizationId);

    if (!organization) {
      throw new Error("Organisateur introuvable.");
    }
  }

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
