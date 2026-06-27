import { and, eq, inArray, isNull } from "drizzle-orm";

import { db } from "@/db";
import {
  eventOverrides,
  events,
  organizations,
  venues,
  type Event,
  type EventMaster,
  type Organization,
  type Venue,
} from "@/db/schema";

import {
  type EventOverridePatch,
  occurrenceOverrideKey,
} from "./overrides.types";
import { rebuildOccurrencesForMaster } from "./occurrence-projector";
import type { EventOffer } from "@/lib/events/offers";

export type StoredEventOverride = typeof eventOverrides.$inferSelect;

export type OverrideIndex = {
  master: Map<string, StoredEventOverride>;
  occurrences: Map<string, Map<string, StoredEventOverride>>;
};

export function buildOverrideIndex(rows: StoredEventOverride[]): OverrideIndex {
  const master = new Map<string, StoredEventOverride>();
  const occurrences = new Map<string, Map<string, StoredEventOverride>>();

  for (const row of rows) {
    if (!row.occurrenceStartAt) {
      master.set(row.eventId, row);
      continue;
    }

    const key = row.occurrenceStartAt.toISOString();
    const eventMap = occurrences.get(row.eventId) ?? new Map();
    eventMap.set(key, row);
    occurrences.set(row.eventId, eventMap);
  }

  return { master, occurrences };
}

export async function loadOverridesForEvents(
  eventIds: string[],
): Promise<OverrideIndex> {
  if (eventIds.length === 0) {
    return { master: new Map(), occurrences: new Map() };
  }

  const rows = await db.query.eventOverrides.findMany({
    where: inArray(eventOverrides.eventId, eventIds),
  });

  return buildOverrideIndex(rows);
}

function applyPatchToEventFields<
  T extends {
    title: string;
    description: string | null;
    startAt: Date;
    endAt: Date | null;
    isAllDay: boolean;
    locationRaw: string | null;
    venueId: string | null;
    organizationId: string | null;
    categories: string[] | null;
    status: Event["status"];
    sourceUrl: string | null;
    offers: EventOffer[] | null;
  },
>(base: T, patch: EventOverridePatch): T {
  const next = { ...base };

  if (patch.title !== undefined) {
    next.title = patch.title;
  }
  if (patch.description !== undefined) {
    next.description = patch.description;
  }
  if (patch.startAt !== undefined) {
    next.startAt = new Date(patch.startAt);
  }
  if (patch.endAt !== undefined) {
    next.endAt = patch.endAt ? new Date(patch.endAt) : null;
  }
  if (patch.isAllDay !== undefined) {
    next.isAllDay = patch.isAllDay;
  }
  if (patch.locationRaw !== undefined) {
    next.locationRaw = patch.locationRaw;
  }
  if (patch.venueId !== undefined) {
    next.venueId = patch.venueId;
  }
  if (patch.organizationId !== undefined) {
    next.organizationId = patch.organizationId;
  }
  if (patch.categories !== undefined) {
    next.categories = patch.categories;
  }
  if (patch.status !== undefined) {
    next.status = patch.status;
  }
  if (patch.sourceUrl !== undefined) {
    next.sourceUrl = patch.sourceUrl;
  }
  if (patch.offers !== undefined) {
    next.offers = patch.offers;
  }

  return next;
}

export function applyMasterOverride(
  master: EventMaster,
  override: StoredEventOverride | undefined,
  relations: {
    organizations: Map<string, Organization>;
    venues: Map<string, Venue>;
  },
): EventMaster {
  if (!override) {
    return master;
  }

  const merged = applyPatchToEventFields(
    {
      ...master,
      offers: null,
    },
    override.patch,
  );

  const organization =
    merged.organizationId !== master.organizationId
      ? relations.organizations.get(merged.organizationId ?? "") ?? null
      : master.organization;

  const venue =
    merged.venueId !== master.venueId
      ? relations.venues.get(merged.venueId ?? "") ?? null
      : master.venue;

  return {
    ...master,
    ...merged,
    organization,
    venue,
  };
}

export type OccurrenceLike = {
  masterEventId: string;
  startAt: Date;
  endAt: Date | null;
  title: string;
  description: string | null;
  isAllDay: boolean;
  locationRaw: string | null;
  sourceUrl: string | null;
  status: Event["status"];
  categories: string[] | null;
  offers: EventOffer[] | null;
  organization: Organization | null;
  venue: Venue | null;
  isOverridden?: boolean;
  isHidden?: boolean;
};

export function applyOccurrenceOverride<T extends OccurrenceLike>(
  occurrence: T,
  override: StoredEventOverride | undefined,
  relations: {
    organizations: Map<string, Organization>;
    venues: Map<string, Venue>;
  },
): T {
  if (!override) {
    return occurrence;
  }

  const patch = override.patch;
  const merged = applyPatchToEventFields(
    {
      title: occurrence.title,
      description: occurrence.description,
      startAt: occurrence.startAt,
      endAt: occurrence.endAt,
      isAllDay: occurrence.isAllDay,
      locationRaw: occurrence.locationRaw,
      venueId: occurrence.venue?.id ?? null,
      organizationId: occurrence.organization?.id ?? null,
      categories: occurrence.categories,
      status: occurrence.status,
      sourceUrl: occurrence.sourceUrl,
      offers: occurrence.offers ?? null,
    },
    patch,
  );

  const organization =
    merged.organizationId !== (occurrence.organization?.id ?? null)
      ? relations.organizations.get(merged.organizationId ?? "") ?? null
      : occurrence.organization;

  const venue =
    merged.venueId !== (occurrence.venue?.id ?? null)
      ? relations.venues.get(merged.venueId ?? "") ?? null
      : occurrence.venue;

  return {
    ...occurrence,
    title: merged.title,
    description: merged.description,
    startAt: merged.startAt,
    endAt: merged.endAt,
    isAllDay: merged.isAllDay,
    locationRaw: merged.locationRaw,
    sourceUrl: merged.sourceUrl,
    status: merged.status,
    categories: merged.categories,
    offers: merged.offers,
    organization,
    venue,
    isOverridden: true,
    isHidden: patch.hidden === true,
  };
}

async function loadRelationMaps(patch: EventOverridePatch) {
  const organizationIds = patch.organizationId ? [patch.organizationId] : [];
  const venueIds = patch.venueId ? [patch.venueId] : [];

  const [organizationRows, venueRows] = await Promise.all([
    organizationIds.length
      ? db.query.organizations.findMany({
          where: inArray(organizations.id, organizationIds),
        })
      : Promise.resolve([]),
    venueIds.length
      ? db.query.venues.findMany({
          where: inArray(venues.id, venueIds),
        })
      : Promise.resolve([]),
  ]);

  return {
    organizations: new Map(organizationRows.map((row) => [row.id, row])),
    venues: new Map(venueRows.map((row) => [row.id, row])),
  };
}

export async function upsertEventOverride(options: {
  eventId: string;
  occurrenceStartAt?: Date | null;
  patch: EventOverridePatch;
}) {
  const existing = options.occurrenceStartAt
    ? await db.query.eventOverrides.findFirst({
        where: and(
          eq(eventOverrides.eventId, options.eventId),
          eq(eventOverrides.occurrenceStartAt, options.occurrenceStartAt),
        ),
      })
    : await db.query.eventOverrides.findFirst({
        where: and(
          eq(eventOverrides.eventId, options.eventId),
          isNull(eventOverrides.occurrenceStartAt),
        ),
      });

  if (existing) {
    const [updated] = await db
      .update(eventOverrides)
      .set({
        patch: { ...existing.patch, ...options.patch },
        notes: options.patch.notes ?? existing.notes,
      })
      .where(eq(eventOverrides.id, existing.id))
      .returning();

    await rebuildOccurrencesForMaster(options.eventId);
    return updated;
  }

  const [created] = await db
    .insert(eventOverrides)
    .values({
      eventId: options.eventId,
      occurrenceStartAt: options.occurrenceStartAt ?? null,
      patch: options.patch,
      notes: options.patch.notes ?? null,
    })
    .returning();

  await rebuildOccurrencesForMaster(options.eventId);
  return created;
}

export async function deleteEventOverride(options: {
  eventId: string;
  occurrenceStartAt?: Date | null;
}) {
  if (options.occurrenceStartAt) {
    await db
      .delete(eventOverrides)
      .where(
        and(
          eq(eventOverrides.eventId, options.eventId),
          eq(eventOverrides.occurrenceStartAt, options.occurrenceStartAt),
        ),
      );
    await rebuildOccurrencesForMaster(options.eventId);
    return;
  }

  await db
    .delete(eventOverrides)
    .where(
      and(
        eq(eventOverrides.eventId, options.eventId),
        isNull(eventOverrides.occurrenceStartAt),
      ),
    );
  await rebuildOccurrencesForMaster(options.eventId);
}

export async function getEventWithOverrides(eventId: string) {
  const event = await db.query.events.findFirst({
    where: eq(events.id, eventId),
    with: {
      source: true,
      organization: true,
      venue: true,
    },
  });

  if (!event) {
    return null;
  }

  const overrides = await loadOverridesForEvents([eventId]);
  const masterOverride = overrides.master.get(eventId);
  const relations = masterOverride
    ? await loadRelationMaps(masterOverride.patch)
    : { organizations: new Map(), venues: new Map() };

  return {
    synced: event,
    masterOverride: masterOverride ?? null,
    occurrenceOverrides: [...(overrides.occurrences.get(eventId)?.values() ?? [])],
    effective: applyMasterOverride(event, masterOverride, relations),
  };
}

export { occurrenceOverrideKey };
