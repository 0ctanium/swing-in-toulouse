import { and, isNull } from "drizzle-orm";
import { startOfDay } from "date-fns";
import { toZonedTime } from "date-fns-tz";

import { db } from "@/db";
import { events } from "@/db/schema";
import { isEventConfirmed } from "@/lib/events/confirmation";
import { loadOverridesForEvents } from "@/lib/events/overrides";
import type { EventOverridePatch } from "@/lib/events/overrides.types";
import {
  expandMasterEventsToOccurrences,
  getDefaultExpansionWindow,
  getDefaultFromDate,
} from "@/lib/ical/recurrence";
import { isVenueAddressConfirmed } from "@/lib/venues/confirmation";
import { siteConfig } from "@/lib/site";
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

async function buildNextOccurrenceMap(recurringMasters: EventMaster[]) {
  const nextOccurrenceById = new Map<string, Date>();
  if (recurringMasters.length === 0) {
    return nextOccurrenceById;
  }

  const today = getDefaultFromDate();
  const window = getDefaultExpansionWindow();
  const occurrences = await expandMasterEventsToOccurrences(
    recurringMasters,
    window,
  );

  for (const occurrence of occurrences) {
    if (occurrence.startAt < today) {
      continue;
    }

    const existing = nextOccurrenceById.get(occurrence.masterEventId);
    if (!existing || occurrence.startAt < existing) {
      nextOccurrenceById.set(occurrence.masterEventId, occurrence.startAt);
    }
  }

  return nextOccurrenceById;
}

function getQueueScheduling(
  event: Pick<EventMaster, "id" | "startAt" | "endAt" | "recurrenceRule">,
  today: Date,
  nextOccurrenceById: Map<string, Date>,
) {
  if (event.recurrenceRule) {
    const nextOccurrence = nextOccurrenceById.get(event.id);
    if (nextOccurrence) {
      return { isUpcoming: true, sortAt: nextOccurrence };
    }
  }

  const end = event.endAt ?? event.startAt;
  return {
    isUpcoming: end >= today,
    sortAt: event.startAt,
  };
}

function partitionQueue<T extends Pick<EventMaster, "id" | "startAt" | "endAt" | "recurrenceRule">>(
  rows: T[],
  nextOccurrenceById: Map<string, Date>,
) {
  const today = startOfDay(toZonedTime(new Date(), siteConfig.timezone));
  const upcoming: Array<{ row: T; sortAt: Date }> = [];
  const past: Array<{ row: T; sortAt: Date }> = [];

  for (const row of rows) {
    const scheduling = getQueueScheduling(row, today, nextOccurrenceById);
    if (scheduling.isUpcoming) {
      upcoming.push({ row, sortAt: scheduling.sortAt });
    } else {
      past.push({ row, sortAt: scheduling.sortAt });
    }
  }

  upcoming.sort((left, right) => left.sortAt.getTime() - right.sortAt.getTime());
  past.sort((left, right) => right.sortAt.getTime() - left.sortAt.getTime());

  return [...upcoming, ...past].map((entry) => entry.row);
}

export async function getEventConfirmQueue(): Promise<EventConfirmQueueItem[]> {
  const rows = await db.query.events.findMany({
    where: and(isNull(events.canonicalEventId), isNull(events.confirmedAt)),
    with: {
      source: true,
      organization: true,
      venue: true,
    },
  });

  const recurringMasters = rows.filter((row) => row.recurrenceRule) as EventMaster[];
  const nextOccurrenceById = await buildNextOccurrenceMap(recurringMasters);
  const ordered = partitionQueue(rows, nextOccurrenceById);
  const overrides = await loadOverridesForEvents(ordered.map((row) => row.id));

  return ordered.map((event) => {
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

export async function getEventConfirmQueueStats() {
  const masters = await db.query.events.findMany({
    where: isNull(events.canonicalEventId),
    columns: { id: true, confirmedAt: true },
  });

  let pendingCount = 0;
  let confirmedCount = 0;

  for (const event of masters) {
    if (isEventConfirmed(event)) {
      confirmedCount += 1;
    } else {
      pendingCount += 1;
    }
  }

  return { pendingCount, confirmedCount };
}
