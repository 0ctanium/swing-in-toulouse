import { formatDistanceToNow, subHours } from "date-fns";
import { fr } from "date-fns/locale";
import { and, count, desc, gte, ne } from "drizzle-orm";
import { cookies } from "next/headers";

import { db } from "@/db";
import { sources, syncLogs } from "@/db/schema";
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
      value: "—",
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

  return venueList.filter((venue) => venueNeedsAddressConfirmation(venue)).length;
}

async function getSourceCounts() {
  const rows = await db
    .select({
      isActive: sources.isActive,
      value: count(),
    })
    .from(sources)
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

async function getLastSyncLog(): Promise<AdminDashboardLastSync | null> {
  const row = await db.query.syncLogs.findFirst({
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

async function getRecentFailedSyncCount() {
  const since = subHours(new Date(), 24);

  const [row] = await db
    .select({ value: count() })
    .from(syncLogs)
    .where(
      and(gte(syncLogs.createdAt, since), ne(syncLogs.status, "success")),
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

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  await cookies();

  const [
    { pendingCount: pendingEvents },
    pendingVenues,
    upcomingEvents,
    sourceCounts,
    lastSync,
    recentFailedSyncs,
  ] = await Promise.all([
    getEventConfirmQueueStats(),
    getVenuePendingConfirmationCount(),
    getUpcomingEventsUncached(),
    getSourceCounts(),
    getLastSyncLog(),
    getRecentFailedSyncCount(),
  ]);

  return {
    pendingEvents,
    pendingVenues,
    upcomingEventCount: upcomingEvents.length,
    activeSources: sourceCounts.activeSources,
    inactiveSources: sourceCounts.inactiveSources,
    activeOrganizers: countActiveOrganizers(upcomingEvents),
    lastSyncDisplay: formatLastSyncDisplay(lastSync),
    recentFailedSyncs,
  };
}
