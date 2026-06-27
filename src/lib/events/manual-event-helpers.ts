import { eq } from "drizzle-orm";

import { db } from "@/db";
import { events, venues } from "@/db/schema";
import type { AdminDataScope } from "@/lib/admin/data-scope";
import { resolveWritableOrganizationId } from "@/lib/admin/data-scope";
import { formatVenueAsDefaultLocation } from "@/lib/sources/defaults";
import { getOrganizationById } from "@/lib/sources/admin";
import { resolveVenueForSync } from "@/lib/venues/canonical";

export class ManualEventError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ManualEventError";
  }
}

export async function loadManualEvent(eventId: string) {
  const event = await db.query.events.findFirst({
    where: eq(events.id, eventId),
    with: {
      source: true,
    },
  });

  if (!event) {
    throw new ManualEventError("Événement introuvable.");
  }

  if (event.source.type !== "manual") {
    throw new ManualEventError(
      "Seuls les événements manuels peuvent être modifiés ici.",
    );
  }

  return event;
}

export async function resolveManualEventOrganizationId(
  dataScope: AdminDataScope,
  organizationId: string | null,
) {
  const resolvedOrganizationId = resolveWritableOrganizationId(
    dataScope,
    organizationId,
  );

  if (resolvedOrganizationId) {
    const organization = await getOrganizationById(resolvedOrganizationId);

    if (!organization) {
      throw new ManualEventError("Organisateur introuvable.");
    }
  }

  return resolvedOrganizationId;
}

export async function resolveVenueFields(venueId: string | null) {
  if (!venueId) {
    return { venueId: null, locationRaw: null };
  }

  const venue = await db.query.venues.findFirst({
    where: eq(venues.id, venueId),
  });

  if (!venue) {
    throw new ManualEventError("Lieu introuvable.");
  }

  const resolved = await resolveVenueForSync(venue);

  return {
    venueId: resolved?.id ?? venue.id,
    locationRaw: formatVenueAsDefaultLocation(resolved ?? venue),
  };
}
