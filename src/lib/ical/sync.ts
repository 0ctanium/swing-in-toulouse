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
import { readIcalBlob } from "@/lib/sources/blob";
import { findOrCreateVenue } from "@/lib/venues/find-or-create";
import { resolveVenueForSync } from "@/lib/venues/canonical";
import {
  hasMaterialEventChanges,
  shouldClearEventConfirmation,
} from "@/lib/events/confirmation";
import { eventUrl } from "@/lib/site";
import { rebuildOccurrencesForMasters } from "@/lib/events/occurrence-projector";
import {
  invalidatePublicCacheForChangedEvents,
  sourceSyncHasPublicChanges,
} from "@/lib/cache/invalidate";

import { hasIcalDataChanges, hasIcalRevisionChanges } from "./changes";
import { fetchAndParseIcalFeed, parseIcalContent } from "./parser";
import type { NormalizedEvent } from "./types";
import { resolveEventUid } from "./uid";

export type SourceSyncStats = {
  created: number;
  updated: number;
  unchanged: number;
  cancelled: number;
};

type UpsertStats = SourceSyncStats;

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

type ChangedEvent = { masterId: string; slug: string };

async function upsertEvent(
  source: SourceWithOrganization,
  normalized: NormalizedEvent,
  stats: UpsertStats,
): Promise<ChangedEvent | undefined> {
  const uid = resolveEventUid(normalized.uid);
  const sourceUid = normalized.uid;
  const baseSlug = generateEventSlug(
    `${slugPrefix(source)}-${normalized.title}`,
    normalized.startAt,
  );

  let existing = await db.query.events.findFirst({
    where: and(eq(events.sourceId, source.id), eq(events.sourceUid, sourceUid)),
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
      return undefined;
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
    return { masterId: existing.id, slug: existing.slug };
  }

  const [created] = await db.insert(events).values(values).returning({
    id: events.id,
    slug: events.slug,
  });
  stats.created += 1;
  return { masterId: created.id, slug: created.slug };
}

async function cancelMissingEvents(
  sourceId: string,
  activeSourceUids: string[],
  stats: UpsertStats,
) {
  const cancelledMasterIds: ChangedEvent[] = [];

  if (activeSourceUids.length === 0) {
    return cancelledMasterIds;
  }

  const activeUidSet = new Set(activeSourceUids);
  const activeEvents = await db.query.events.findMany({
    where: and(
      eq(events.sourceId, sourceId),
      isNotNull(events.sourceUid),
      eq(events.status, "published"),
    ),
    columns: {
      id: true,
      slug: true,
      sourceUid: true,
      sequence: true,
      confirmedAt: true,
    },
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
    cancelledMasterIds.push({ masterId: event.id, slug: event.slug });
  }

  return cancelledMasterIds;
}

async function persistIcalHttpValidators(
  sourceId: string,
  etag: string | null,
  lastModified: string | null,
) {
  await db
    .update(sources)
    .set({
      icalHttpEtag: etag,
      icalHttpLastModified: lastModified,
    })
    .where(eq(sources.id, sourceId));
}

async function loadSourceEvents(source: SourceWithOrganization) {
  if (source.type === "ical") {
    if (!source.url) {
      throw new Error("URL iCal manquante pour cette source.");
    }

    return fetchAndParseIcalFeed(source.url, {
      etag: source.icalHttpEtag,
      lastModified: source.icalHttpLastModified,
    });
  }

  if (source.type === "ical-file") {
    if (!source.icalBlobUrl) {
      throw new Error("Fichier iCal manquant pour cette source.");
    }

    const content = await readIcalBlob(source.icalBlobUrl);
    return {
      status: "ok" as const,
      events: await parseIcalContent(content),
    };
  }

  if (source.type === "manual") {
    throw new Error("Les sources manuelles ne peuvent pas être synchronisées.");
  }

  throw new Error(`Unsupported source type: ${source.type}`);
}

export async function syncSource(source: SourceWithOrganization) {
  const stats: UpsertStats = {
    created: 0,
    updated: 0,
    unchanged: 0,
    cancelled: 0,
  };

  try {
    const feed = await loadSourceEvents(source);

    if (feed.status === "not-modified") {
      await db.insert(syncLogs).values({
        sourceId: source.id,
        status: "success",
        message: `Feed unchanged (304) for ${source.name}`,
        eventsCreated: 0,
        eventsUpdated: 0,
        eventsCancelled: 0,
      });

      return stats;
    }

    const parsedEvents = feed.events;
    const activeSourceUids: string[] = [];
    const changedEvents: ChangedEvent[] = [];

    for (const parsedEvent of parsedEvents) {
      activeSourceUids.push(parsedEvent.uid);
      const changed = await upsertEvent(source, parsedEvent, stats);
      if (changed) {
        changedEvents.push(changed);
      }
    }

    const cancelledEvents = await cancelMissingEvents(
      source.id,
      activeSourceUids,
      stats,
    );

    changedEvents.push(...cancelledEvents);

    if (changedEvents.length > 0) {
      await rebuildOccurrencesForMasters(
        changedEvents.map((event) => event.masterId),
      );
    }

    if (sourceSyncHasPublicChanges(stats)) {
      invalidatePublicCacheForChangedEvents(
        [...new Set(changedEvents.map((event) => event.slug))],
      );
    }

    if (source.type === "ical" && "etag" in feed) {
      await persistIcalHttpValidators(source.id, feed.etag, feed.lastModified);
    }

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

export async function syncSourceById(sourceId: string) {
  const source = await db.query.sources.findFirst({
    where: eq(sources.id, sourceId),
    with: {
      organization: true,
    },
  });

  if (!source) {
    throw new Error("Source introuvable.");
  }

  return syncSource(source);
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
    where: and(eq(sources.isActive, true), eq(sources.type, "ical")),
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
