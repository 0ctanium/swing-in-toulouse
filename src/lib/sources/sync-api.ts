import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import { sources } from "@/db/schema";
import { invalidateAllPublicCache } from "@/lib/cache/invalidate";
import type { SourceSyncStats } from "@/lib/ical/sync";
import { syncSource, syncSourceById } from "@/lib/ical/sync";

export async function runSourceSync(sourceId: string) {
  try {
    const stats = await syncSourceById(sourceId);
    invalidateAllPublicCache();
    return { stats, error: null as null };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Synchronisation impossible.";

    invalidateAllPublicCache();

    return {
      stats: null,
      error: message,
    };
  }
}

export function sourceSyncResponse(
  source: typeof sources.$inferSelect,
  sync: { stats: SourceSyncStats | null; error: string | null },
  status = 200,
) {
  return NextResponse.json(
    {
      source,
      sync: sync.error
        ? { error: sync.error }
        : (sync.stats ?? {
            created: 0,
            updated: 0,
            unchanged: 0,
            cancelled: 0,
          }),
    },
    { status },
  );
}

export async function loadSourceWithOrganization(sourceId: string) {
  return db.query.sources.findFirst({
    where: eq(sources.id, sourceId),
    with: {
      organization: true,
    },
  });
}

export async function syncSourceRecord(
  source: NonNullable<Awaited<ReturnType<typeof loadSourceWithOrganization>>>,
) {
  try {
    const stats = await syncSource(source);
    invalidateAllPublicCache();
    return { stats, error: null as null };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Synchronisation impossible.";

    invalidateAllPublicCache();

    return {
      stats: null,
      error: message,
    };
  }
}
