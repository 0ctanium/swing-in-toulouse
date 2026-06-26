import {
  and,
  asc,
  eq,
  gte,
  inArray,
  isNotNull,
  lt,
  lte,
  or,
  sql,
} from "drizzle-orm";

import { db } from "@/db";
import {
  eventOccurrences,
  organizations,
  venues,
  type EventOccurrenceRow,
  type Organization,
  type Source,
  type Venue,
} from "@/db/schema";
import {
  getArchiveLookbackStart,
  getLastCompleteArchiveMonthEnd,
  type ArchiveMonth,
} from "@/lib/events/hub";
import { getProjectionWindow } from "@/lib/events/projection-window";
import type { EventOccurrence } from "@/lib/ical/recurrence";
import { siteConfig } from "@/lib/site";

type OccurrenceWithRelations = EventOccurrenceRow & {
  organization: Organization | null;
  venue: Venue | null;
  source: Source;
};

function toEventOccurrence(row: OccurrenceWithRelations): EventOccurrence {
  return {
    id: row.id,
    masterEventId: row.masterEventId,
    slug: row.slug,
    title: row.title,
    description: row.description,
    startAt: row.startAt,
    endAt: row.endAt,
    isAllDay: row.isAllDay,
    locationRaw: row.locationRaw,
    sourceUrl: row.sourceUrl,
    url: row.url,
    icalData: null,
    status: row.status,
    categories: row.categories,
    organization: row.organization,
    source: row.source,
    venue: row.venue,
    isOverridden: row.isOverridden,
    seriesStartAt: row.seriesStartAt,
  };
}

function buildWindowOverlapFilter(from: Date, to: Date) {
  return or(
    and(
      gte(eventOccurrences.startAt, from),
      lte(eventOccurrences.startAt, to),
    ),
    and(
      isNotNull(eventOccurrences.endAt),
      gte(eventOccurrences.endAt, from),
      lte(eventOccurrences.startAt, to),
    ),
  );
}

export type QueryOccurrencesOptions = {
  from: Date;
  to: Date;
  organizationId?: string;
  canonicalVenueId?: string;
  categoryName?: string;
  limit?: number;
};

export async function queryOccurrencesInWindow(
  options: QueryOccurrencesOptions,
): Promise<EventOccurrence[]> {
  const filters = [
    eq(eventOccurrences.status, "published"),
    buildWindowOverlapFilter(options.from, options.to),
  ];

  if (options.organizationId) {
    filters.push(eq(eventOccurrences.organizationId, options.organizationId));
  }

  if (options.canonicalVenueId) {
    filters.push(
      eq(eventOccurrences.canonicalVenueId, options.canonicalVenueId),
    );
  }

  if (options.categoryName) {
    filters.push(
      sql`${options.categoryName} = ANY(${eventOccurrences.categories})`,
    );
  }

  const rows = await db.query.eventOccurrences.findMany({
    where: and(...filters),
    with: {
      organization: true,
      venue: true,
      source: true,
    },
    orderBy: asc(eventOccurrences.startAt),
    limit: options.limit,
  });

  return rows.map((row) => toEventOccurrence(row as OccurrenceWithRelations));
}

export async function listArchiveMonthsFromProjection(
  now = new Date(),
): Promise<ArchiveMonth[]> {
  const from = getArchiveLookbackStart(now);
  const to = getLastCompleteArchiveMonthEnd(now);

  if (to < from) {
    return [];
  }

  const rows = await db
    .selectDistinct({
      monthKey: sql<string>`to_char(${eventOccurrences.startAt} AT TIME ZONE ${siteConfig.timezone}, 'YYYY-MM')`,
    })
    .from(eventOccurrences)
    .where(
      and(
        eq(eventOccurrences.status, "published"),
        gte(eventOccurrences.startAt, from),
        lte(eventOccurrences.startAt, to),
        lt(eventOccurrences.startAt, now),
      ),
    );

  return rows
    .map((row) => row.monthKey)
    .filter((key): key is string => Boolean(key))
    .sort((left, right) => right.localeCompare(left))
    .map((key) => {
      const [year, month] = key.split("-").map(Number);
      return { year, month, key };
    });
}

export async function listDistinctCategoriesInProjectionWindow(
  window = getProjectionWindow(),
) {
  const result = await db.execute<{ category: string }>(sql`
    SELECT DISTINCT unnest(categories) AS category
    FROM event_occurrences
    WHERE status = 'published'
      AND start_at >= ${window.from}
      AND start_at <= ${window.to}
      AND categories IS NOT NULL
    ORDER BY category
  `);

  return result.rows
    .map((row) => row.category?.trim())
    .filter((category): category is string => Boolean(category));
}

export async function listDistinctVenueIdsInProjectionWindow(
  window = getProjectionWindow(),
) {
  const rows = await db
    .selectDistinct({ venueId: eventOccurrences.canonicalVenueId })
    .from(eventOccurrences)
    .where(
      and(
        eq(eventOccurrences.status, "published"),
        gte(eventOccurrences.startAt, window.from),
        lte(eventOccurrences.startAt, window.to),
        isNotNull(eventOccurrences.canonicalVenueId),
      ),
    );

  return rows
    .map((row) => row.venueId)
    .filter((venueId): venueId is string => Boolean(venueId));
}

export async function listDistinctOrganizationIdsInProjectionWindow(
  window = getProjectionWindow(),
) {
  const rows = await db
    .selectDistinct({ organizationId: eventOccurrences.organizationId })
    .from(eventOccurrences)
    .where(
      and(
        eq(eventOccurrences.status, "published"),
        gte(eventOccurrences.startAt, window.from),
        lte(eventOccurrences.startAt, window.to),
        isNotNull(eventOccurrences.organizationId),
      ),
    );

  return rows
    .map((row) => row.organizationId)
    .filter((organizationId): organizationId is string =>
      Boolean(organizationId),
    );
}

export async function loadVenuesByIds(venueIds: string[]) {
  if (venueIds.length === 0) {
    return [];
  }

  return db.query.venues.findMany({
    where: inArray(venues.id, venueIds),
    columns: { id: true, slug: true, name: true },
  });
}

export async function loadOrganizationsByIds(organizationIds: string[]) {
  if (organizationIds.length === 0) {
    return [];
  }

  return db.query.organizations.findMany({
    where: inArray(organizations.id, organizationIds),
    columns: { id: true, slug: true, name: true },
  });
}
