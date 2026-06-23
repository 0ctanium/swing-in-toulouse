import { startOfDay } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { events } from "@/db/schema";
import type { AdminDataScope } from "@/lib/admin/data-scope";
import { isEventConfirmed } from "@/lib/events/confirmation";
import { loadOverridesForEvents } from "@/lib/events/overrides";
import type { EventOverridePatch } from "@/lib/events/overrides.types";
import {
  buildNextOccurrenceMap,
  getEventScheduling,
  sortEventsForAdmin,
} from "@/lib/events/event-scheduling";
import { siteConfig } from "@/lib/site";
import { isVenueAddressConfirmed } from "@/lib/venues/confirmation";
import type { EventMaster } from "@/db/schema";

export type EventConfirmQueueItem = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  startAt: string;
  endAt: string | null;
  isAllDay: boolean;
  locationRaw: string | null;
  recurrenceRule: string | null;
  nextOccurrenceAt: string | null;
  sourceName: string;
  organizationName: string | null;
  venueName: string | null;
  venueNeedsConfirmation: boolean;
  categories: string[] | null;
  synced: {
    title: string;
    description: string | null;
    organizationId: string | null;
    venueId: string | null;
    categories: string[] | null;
    status: "published" | "cancelled";
    sourceUrl: string | null;
  };
  currentPatch: EventOverridePatch;
};

export async function getEventConfirmQueue(
  scope: AdminDataScope,
): Promise<EventConfirmQueueItem[]> {
  const rows = await db.query.events.findMany({
    where:
      scope.mode === "org"
        ? and(
            isNull(events.canonicalEventId),
            isNull(events.confirmedAt),
            eq(events.organizationId, scope.organizationId),
          )
        : and(isNull(events.canonicalEventId), isNull(events.confirmedAt)),
    with: {
      source: true,
      organization: true,
      venue: true,
    },
  });

  const recurringMasters = rows.filter((row) => row.recurrenceRule) as EventMaster[];
  const nextOccurrenceById = await buildNextOccurrenceMap(recurringMasters);
  const sorted = sortEventsForAdmin(rows, nextOccurrenceById).filter(
    (entry) => entry.isUpcoming,
  );
  const overrides = await loadOverridesForEvents(sorted.map((entry) => entry.row.id));

  return sorted.map(({ row: event }) => {
    const masterOverride = overrides.master.get(event.id);

    return {
      id: event.id,
      slug: event.slug,
      title: event.title,
      description: event.description,
      startAt: event.startAt.toISOString(),
      endAt: event.endAt?.toISOString() ?? null,
      isAllDay: event.isAllDay,
      locationRaw: event.locationRaw,
      recurrenceRule: event.recurrenceRule,
      nextOccurrenceAt:
        nextOccurrenceById.get(event.id)?.toISOString() ?? null,
      sourceName: event.source.name,
      organizationName: event.organization?.name ?? null,
      venueName: event.venue?.name ?? event.locationRaw,
      venueNeedsConfirmation: Boolean(
        event.venue && !isVenueAddressConfirmed(event.venue),
      ),
      categories: event.categories,
      synced: {
        title: event.title,
        description: event.description,
        organizationId: event.organizationId,
        venueId: event.venueId,
        categories: event.categories,
        status: event.status,
        sourceUrl: event.sourceUrl,
      },
      currentPatch: masterOverride?.patch ?? {},
    };
  });
}

export async function getEventConfirmQueueStats(scope: AdminDataScope) {
  const masters = await db.query.events.findMany({
    where:
      scope.mode === "org"
        ? and(
            isNull(events.canonicalEventId),
            eq(events.organizationId, scope.organizationId),
          )
        : isNull(events.canonicalEventId),
    columns: {
      id: true,
      confirmedAt: true,
      startAt: true,
      endAt: true,
      recurrenceRule: true,
    },
  });

  const recurringMasters = masters.filter(
    (event) => event.recurrenceRule,
  ) as EventMaster[];
  const nextOccurrenceById = await buildNextOccurrenceMap(recurringMasters);
  const today = startOfDay(toZonedTime(new Date(), siteConfig.timezone));

  let pendingCount = 0;
  let confirmedCount = 0;

  for (const event of masters) {
    if (isEventConfirmed(event)) {
      confirmedCount += 1;
    } else if (getEventScheduling(event, today, nextOccurrenceById).isUpcoming) {
      pendingCount += 1;
    }
  }

  return { pendingCount, confirmedCount };
}
