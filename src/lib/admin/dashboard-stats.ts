import { formatDistanceToNow, subHours } from "date-fns";
import { fr } from "date-fns/locale";
import { and, count, desc, eq, gte, inArray, ne } from "drizzle-orm";
import { cookies } from "next/headers";

import { db } from "@/db";
import { organizations, sources, syncLogs } from "@/db/schema";
import type { AdminDataScope } from "@/lib/admin/data-scope";
import { getEventConfirmQueueStats } from "@/lib/events/confirm-queue";
import { getUpcomingEventsUncached } from "@/lib/events/queries";
import { venueNeedsAddressConfirmation } from "@/lib/venues/confirmation";
import { listVenuesWithStats } from "@/lib/venues/matching";

export type AdminDashboardLastSync = {
  status: "success" | "partial" | "failed";
  createdAt: Date;
  sourceName: string | null;
  eventsCreated: number;
  eventsUpdated: number;
  eventsCancelled: number;
  message: string | null;
};

export type AdminDashboardLastSyncDisplay = {
  value: string;
  detail: string;
  variant: "default" | "warning" | "muted";
};

export type AdminDashboardStats = {
  showPlatformStats: boolean;
  pendingEvents: number;
  pendingVenues: number;
  upcomingEventCount: number;
  activeSources: number;
  inactiveSources: number;
  activeOrganizers: number;
  lastSyncDisplay: AdminDashboardLastSyncDisplay;
  recentFailedSyncs: number;
};

function formatLastSyncDisplay(
  lastSync: AdminDashboardLastSync | null,
): AdminDashboardLastSyncDisplay {
  if (!lastSync) {
    return {
      value: "-",
      detail: "Aucune synchronisation enregistrée",
      variant: "muted",
    };
  }

  const relativeTime = formatDistanceToNow(lastSync.createdAt, {
    addSuffix: true,
    locale: fr,
  });

  const statusLabel =
    lastSync.status === "success"
      ? "OK"
      : lastSync.status === "partial"
        ? "Partielle"
        : "Échec";

  const changes = [
    lastSync.eventsCreated > 0 ? `${lastSync.eventsCreated} créé(s)` : null,
    lastSync.eventsUpdated > 0 ? `${lastSync.eventsUpdated} modifié(s)` : null,
    lastSync.eventsCancelled > 0
      ? `${lastSync.eventsCancelled} retiré(s)`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const sourceLabel = lastSync.sourceName ?? "Source inconnue";
  const detail = changes
    ? `${sourceLabel} · ${changes} · ${relativeTime}`
    : `${sourceLabel} · ${relativeTime}`;

  return {
    value: statusLabel,
    detail,
    variant: lastSync.status === "success" ? "default" : "warning",
  };
}

async function getVenuePendingConfirmationCount() {
  const venueList = await listVenuesWithStats();

  return venueList.filter((venue) => venueNeedsAddressConfirmation(venue))
    .length;
}

async function getSourceCounts(scope: AdminDataScope) {
  const rows = await db
    .select({
      isActive: sources.isActive,
      value: count(),
    })
    .from(sources)
    .where(
      scope.mode === "org"
        ? eq(sources.organizationId, scope.organizationId)
        : undefined,
    )
    .groupBy(sources.isActive);

  let activeSources = 0;
  let inactiveSources = 0;

  for (const row of rows) {
    const total = Number(row.value);

    if (row.isActive) {
      activeSources = total;
    } else {
      inactiveSources = total;
    }
  }

  return { activeSources, inactiveSources };
}

async function getScopedSourceIds(scope: AdminDataScope) {
  if (scope.mode === "all") {
    return null;
  }

  const rows = await db.query.sources.findMany({
    where: eq(sources.organizationId, scope.organizationId),
    columns: { id: true },
  });

  return rows.map((row) => row.id);
}

async function getLastSyncLog(
  scope: AdminDataScope,
): Promise<AdminDashboardLastSync | null> {
  const sourceIds = await getScopedSourceIds(scope);

  if (sourceIds?.length === 0) {
    return null;
  }

  const row = await db.query.syncLogs.findFirst({
    where: sourceIds ? inArray(syncLogs.sourceId, sourceIds) : undefined,
    orderBy: desc(syncLogs.createdAt),
    with: {
      source: {
        columns: { name: true },
      },
    },
  });

  if (!row) {
    return null;
  }

  return {
    status: row.status,
    createdAt: row.createdAt,
    sourceName: row.source?.name ?? null,
    eventsCreated: row.eventsCreated,
    eventsUpdated: row.eventsUpdated,
    eventsCancelled: row.eventsCancelled,
    message: row.message,
  };
}

async function getRecentFailedSyncCount(scope: AdminDataScope) {
  const since = subHours(new Date(), 24);
  const sourceIds = await getScopedSourceIds(scope);

  if (sourceIds?.length === 0) {
    return 0;
  }

  const [row] = await db
    .select({ value: count() })
    .from(syncLogs)
    .where(
      and(
        gte(syncLogs.createdAt, since),
        ne(syncLogs.status, "success"),
        sourceIds ? inArray(syncLogs.sourceId, sourceIds) : undefined,
      ),
    );

  return Number(row?.value ?? 0);
}

function countActiveOrganizers(
  upcomingEvents: Awaited<ReturnType<typeof getUpcomingEventsUncached>>,
) {
  const organizerIds = new Set<string>();

  for (const event of upcomingEvents) {
    if (event.organization?.id) {
      organizerIds.add(event.organization.id);
    }
  }

  return organizerIds.size;
}

async function getScopedUpcomingEvents(scope: AdminDataScope) {
  if (scope.mode === "all") {
    return getUpcomingEventsUncached();
  }

  const organization = await db.query.organizations.findFirst({
    where: eq(organizations.id, scope.organizationId),
    columns: { slug: true },
  });

  if (!organization) {
    return [];
  }

  return getUpcomingEventsUncached({ organizationSlug: organization.slug });
}

export async function getAdminDashboardStats(
  scope: AdminDataScope,
): Promise<AdminDashboardStats> {
  await cookies();

  const showPlatformStats = scope.mode === "all";
  const [
    { pendingCount: pendingEvents },
    pendingVenues,
    upcomingEvents,
    sourceCounts,
    lastSync,
    recentFailedSyncs,
  ] = await Promise.all([
    getEventConfirmQueueStats(scope),
    showPlatformStats ? getVenuePendingConfirmationCount() : Promise.resolve(0),
    getScopedUpcomingEvents(scope),
    getSourceCounts(scope),
    getLastSyncLog(scope),
    getRecentFailedSyncCount(scope),
  ]);

  return {
    showPlatformStats,
    pendingEvents,
    pendingVenues,
    upcomingEventCount: upcomingEvents.length,
    activeSources: sourceCounts.activeSources,
    inactiveSources: sourceCounts.inactiveSources,
    activeOrganizers: showPlatformStats
      ? countActiveOrganizers(upcomingEvents)
      : 1,
    lastSyncDisplay: formatLastSyncDisplay(lastSync),
    recentFailedSyncs,
  };
}
