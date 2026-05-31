import { subHours } from "date-fns";
import { and, count, desc, gte, ne } from "drizzle-orm";

import { db } from "@/db";
import { sources, syncLogs } from "@/db/schema";
import { getEventConfirmQueueStats } from "@/lib/events/confirm-queue";
import { getUpcomingEventsUncached } from "@/lib/events/queries";
import { isVenueAddressConfirmed } from "@/lib/venues/confirmation";
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

export type AdminDashboardStats = {
  pendingEvents: number;
  pendingVenues: number;
  upcomingEventCount: number;
  activeSources: number;
  inactiveSources: number;
  activeOrganizers: number;
  lastSync: AdminDashboardLastSync | null;
  recentFailedSyncs: number;
};

async function getVenuePendingConfirmationCount() {
  const venueList = await listVenuesWithStats();

  return venueList.filter(
    (venue) => venue.eventCount > 0 && !isVenueAddressConfirmed(venue),
  ).length;
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
    lastSync,
    recentFailedSyncs,
  };
}
