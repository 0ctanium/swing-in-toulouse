import { and, eq, isNotNull } from "drizzle-orm";

import { db } from "@/db";
import {
  events,
  sources,
  syncLogs,
  type SourceWithOrganization,
} from "@/db/schema";
import { generateEventSlug } from "@/lib/slug";
import {
  resolveSyncedCategoriesForUpsert,
  resolveSyncedLocationForUpsert,
} from "@/lib/sources/defaults";
import { findOrCreateVenue } from "@/lib/venues/find-or-create";
import { resolveVenueForSync } from "@/lib/venues/canonical";
import {
  hasMaterialEventChanges,
  shouldClearEventConfirmation,
} from "@/lib/events/confirmation";
import { eventUrl } from "@/lib/site";

import {
  hasIcalDataChanges,
  hasIcalRevisionChanges,
} from "./changes";
import { fetchAndParseIcalFeed } from "./parser";
import type { NormalizedEvent } from "./types";
import { resolveEventUid } from "./uid";

type UpsertStats = {
  created: number;
  updated: number;
  unchanged: number;
  cancelled: number;
};

function dbStatusFromNormalized(
  status: NormalizedEvent["status"],
): "published" | "cancelled" {
  return status === "cancelled" ? "cancelled" : "published";
}

function slugPrefix(source: SourceWithOrganization) {
  return source.organization?.slug ?? source.slug;
}

async function resolveUniqueSlug(baseSlug: string, uid: string) {
  const conflicting = await db.query.events.findFirst({
    where: eq(events.slug, baseSlug),
  });

  if (!conflicting || conflicting.uid === uid) {
    return baseSlug;
  }

  const suffix = uid.replace(/[@.]/g, "-").slice(0, 12);
  return `${baseSlug}-${suffix}`;
}

async function upsertEvent(
  source: SourceWithOrganization,
  normalized: NormalizedEvent,
  stats: UpsertStats,
) {
  const uid = resolveEventUid(normalized.uid);
  const sourceUid = normalized.uid;
  const baseSlug = generateEventSlug(
    `${slugPrefix(source)}-${normalized.title}`,
    normalized.startAt,
  );

  let existing = await db.query.events.findFirst({
    where: and(
      eq(events.sourceId, source.id),
      eq(events.sourceUid, sourceUid),
    ),
  });

  if (!existing) {
    existing = await db.query.events.findFirst({
      where: eq(events.uid, uid),
    });
  }

  const location = resolveSyncedLocationForUpsert(source, normalized, existing);
  const categories = resolveSyncedCategoriesForUpsert(
    source,
    normalized,
    existing,
  );
  const venue = location
    ? await resolveVenueForSync(await findOrCreateVenue(location))
    : null;

  const slug = existing?.slug ?? (await resolveUniqueSlug(baseSlug, uid));
  const now = new Date();
  const ownedBySource = !existing || existing.sourceId === source.id;
  const values = {
    sourceId: existing?.sourceId ?? source.id,
    organizationId: ownedBySource
      ? source.organizationId
      : existing!.organizationId,
    venueId: venue?.id ?? null,
    uid,
    sourceUid,
    slug,
    title: normalized.title,
    description: normalized.description ?? null,
    startAt: normalized.startAt,
    endAt: normalized.endAt ?? null,
    isAllDay: normalized.isAllDay,
    locationRaw: location,
    url: eventUrl(slug),
    sourceUrl: normalized.sourceUrl ?? null,
    icalData: normalized.icalData ?? null,
    status: dbStatusFromNormalized(normalized.status),
    recurrenceRule: normalized.recurrenceRule ?? null,
    categories,
    sequence: normalized.sequence,
    lastModified: normalized.lastModified,
    syncedAt: now,
  };

  if (existing) {
    const materialChanges = hasMaterialEventChanges(existing, values);
    const hasChanges =
      materialChanges ||
      hasIcalDataChanges(existing.icalData, values.icalData) ||
      hasIcalRevisionChanges(existing, {
        sequence: normalized.sequence,
        lastModified: normalized.lastModified,
      });

    if (!hasChanges) {
      await db
        .update(events)
        .set({ syncedAt: now })
        .where(eq(events.id, existing.id));

      stats.unchanged += 1;
      return;
    }

    await db
      .update(events)
      .set({
        ...values,
        slug: existing.slug,
        url: eventUrl(existing.slug),
        syncedAt: now,
        ...(shouldClearEventConfirmation(existing, values)
          ? { confirmedAt: null }
          : {}),
      })
      .where(eq(events.id, existing.id));

    stats.updated += 1;
    return;
  }

  await db.insert(events).values(values);
  stats.created += 1;
}

async function cancelMissingEvents(
  sourceId: string,
  activeSourceUids: string[],
  stats: UpsertStats,
) {
  if (activeSourceUids.length === 0) {
    return;
  }

  const activeUidSet = new Set(activeSourceUids);
  const activeEvents = await db.query.events.findMany({
    where: and(
      eq(events.sourceId, sourceId),
      isNotNull(events.sourceUid),
      eq(events.status, "published"),
    ),
  });

  const now = new Date();

  for (const event of activeEvents) {
    if (!event.sourceUid || activeUidSet.has(event.sourceUid)) {
      continue;
    }

    await db
      .update(events)
      .set({
        status: "cancelled",
        sequence: event.sequence + 1,
        lastModified: now,
        syncedAt: now,
        ...(event.confirmedAt ? { confirmedAt: null } : {}),
      })
      .where(eq(events.id, event.id));

    stats.cancelled += 1;
  }
}

export async function syncSource(source: SourceWithOrganization) {
  if (source.type !== "ical") {
    throw new Error(`Unsupported source type: ${source.type}`);
  }

  const stats: UpsertStats = { created: 0, updated: 0, unchanged: 0, cancelled: 0 };

  try {
    const parsedEvents = await fetchAndParseIcalFeed(source.url);
    const activeSourceUids: string[] = [];

    for (const parsedEvent of parsedEvents) {
      activeSourceUids.push(parsedEvent.uid);
      await upsertEvent(source, parsedEvent, stats);
    }

    await cancelMissingEvents(source.id, activeSourceUids, stats);

    await db.insert(syncLogs).values({
      sourceId: source.id,
      status: "success",
      message: `Synced ${parsedEvents.length} events from ${source.name}`,
      eventsCreated: stats.created,
      eventsUpdated: stats.updated,
      eventsCancelled: stats.cancelled,
    });

    return stats;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown sync error";

    await db.insert(syncLogs).values({
      sourceId: source.id,
      status: "failed",
      message,
      eventsCreated: stats.created,
      eventsUpdated: stats.updated,
      eventsCancelled: stats.cancelled,
    });

    throw error;
  }
}

type SyncResult =
  | {
      source: SourceWithOrganization;
      stats: UpsertStats;
      error: null;
    }
  | {
      source: SourceWithOrganization;
      stats?: null;
      error: Error;
    };

export async function* syncAllSources(): AsyncGenerator<SyncResult> {
  const activeSources = await db.query.sources.findMany({
    where: eq(sources.isActive, true),
    with: {
      organization: true,
    },
  });

  for (const source of activeSources) {
    try {
      const stats = await syncSource(source);
      yield { source, stats, error: null };
    } catch (error) {
      yield {
        source,
        stats: null,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }
}

/** @deprecated Use syncAllSources */
export const syncAllOrganizations = syncAllSources;
