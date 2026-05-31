import { isNull } from "drizzle-orm";

import { db } from "@/db";
import { events } from "@/db/schema";
import { isEventConfirmed } from "@/lib/events/confirmation";
import {
  NONE_FILTER_VALUE,
  type AdminEventSortColumn,
  type AdminEventSortDir,
  type AdminEventStateFilter,
  type AdminEventsQuery,
} from "@/lib/events/admin-events-params";
import { mergeMastersWithMasterOverrides } from "@/lib/events/expand-with-overrides";
import {
  buildNextOccurrenceMap,
  getEventDisplayDate,
  sortEventsForAdmin,
} from "@/lib/events/event-scheduling";
import {
  buildGroupedCategoryFilterOptions,
  flattenGroupedCategoryFilterOptions,
  type GroupedCategoryFilterOptions,
} from "@/lib/event-category-tags/grouped-options";
import { loadEventCategoryTagMetadataMap } from "@/lib/event-category-tags/metadata";
import { isVenueAddressConfirmed } from "@/lib/venues/confirmation";
import type { EventMaster } from "@/db/schema";

export const ADMIN_EVENTS_PAGE_SIZE = 25;

export type AdminEventTableRow = {
  id: string;
  slug: string;
  title: string;
  displayStartAt: string;
  endAt: string | null;
  isAllDay: boolean;
  recurrenceRule: string | null;
  sourceName: string;
  organizationId: string | null;
  organizationName: string | null;
  venueId: string | null;
  venueName: string | null;
  categories: string[] | null;
  status: "published" | "cancelled";
  isConfirmed: boolean;
  hasMasterOverride: boolean;
  venueNeedsConfirmation: boolean;
  isUpcoming: boolean;
  stateKey: AdminEventStateFilter;
};

export type AdminEventFilterOption = {
  value: string;
  label: string;
};

export type AdminEventsFilterOptions = {
  venues: AdminEventFilterOption[];
  organizations: AdminEventFilterOption[];
  categories: AdminEventFilterOption[];
  categoryGroups: GroupedCategoryFilterOptions;
  states: AdminEventFilterOption[];
};

export type AdminEventsTableResult = {
  rows: AdminEventTableRow[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  query: AdminEventsQuery;
};

type AdminEventRow = Awaited<
  ReturnType<typeof db.query.events.findMany>
>[number] & {
  source: { name: string };
  organization: { name: string } | null;
  venue: {
    name: string;
    addressConfirmedAt: Date | null;
    latitude: number | null;
    longitude: number | null;
  } | null;
  overrides: Array<{ occurrenceStartAt: Date | null }>;
};

export const ADMIN_EVENT_STATE_OPTIONS: AdminEventFilterOption[] = [
  { value: "pending", label: "À confirmer" },
  { value: "modified", label: "Modifié" },
  { value: "confirmed", label: "Confirmé" },
];

function sortOptions(options: AdminEventFilterOption[]) {
  return options.sort((left, right) =>
    left.label.localeCompare(right.label, "fr"),
  );
}

export function getAdminEventStateKey(row: {
  isConfirmed: boolean;
  hasMasterOverride: boolean;
}): AdminEventStateFilter {
  if (!row.isConfirmed) {
    return "pending";
  }

  if (row.hasMasterOverride) {
    return "modified";
  }

  return "confirmed";
}

function toTableRow(
  event: AdminEventRow,
  nextOccurrenceById: Map<string, Date>,
  isUpcoming: boolean,
): AdminEventTableRow {
  const displayStartAt = getEventDisplayDate(event, nextOccurrenceById);
  const isConfirmed = isEventConfirmed(event);
  const hasMasterOverride = event.overrides.some(
    (override) => override.occurrenceStartAt === null,
  );

  return {
    id: event.id,
    slug: event.slug,
    title: event.title,
    displayStartAt: displayStartAt.toISOString(),
    endAt: event.endAt?.toISOString() ?? null,
    isAllDay: event.isAllDay,
    recurrenceRule: event.recurrenceRule,
    sourceName: event.source.name,
    organizationId: event.organizationId,
    organizationName: event.organization?.name ?? null,
    venueId: event.venueId,
    venueName: event.venue?.name ?? event.locationRaw,
    categories: event.categories,
    status: event.status,
    isConfirmed,
    hasMasterOverride,
    venueNeedsConfirmation: Boolean(
      event.venue && !isVenueAddressConfirmed(event.venue),
    ),
    isUpcoming,
    stateKey: getAdminEventStateKey({ isConfirmed, hasMasterOverride }),
  };
}

function compareStrings(left: string | null | undefined, right: string | null | undefined) {
  return (left ?? "").localeCompare(right ?? "", "fr", { sensitivity: "base" });
}

function compareState(left: AdminEventStateFilter, right: AdminEventStateFilter) {
  const order: Record<AdminEventStateFilter, number> = {
    pending: 0,
    modified: 1,
    confirmed: 2,
  };

  return order[left] - order[right];
}

function sortTableRows(
  rows: AdminEventTableRow[],
  sort: AdminEventSortColumn,
  dir: AdminEventSortDir,
) {
  const multiplier = dir === "asc" ? 1 : -1;

  return [...rows].sort((left, right) => {
    let comparison = 0;

    switch (sort) {
      case "date":
        comparison =
          new Date(left.displayStartAt).getTime() -
          new Date(right.displayStartAt).getTime();
        break;
      case "title":
        comparison = compareStrings(left.title, right.title);
        break;
      case "venue":
        comparison = compareStrings(left.venueName, right.venueName);
        break;
      case "org":
        comparison = compareStrings(left.organizationName, right.organizationName);
        break;
      case "state":
        comparison = compareState(left.stateKey, right.stateKey);
        break;
    }

    if (comparison === 0) {
      comparison = compareStrings(left.title, right.title);
    }

    return comparison * multiplier;
  });
}

function matchesFilters(row: AdminEventTableRow, query: AdminEventsQuery) {
  if (query.venue.length > 0) {
    const venueKey = row.venueId ?? NONE_FILTER_VALUE;
    if (!query.venue.includes(venueKey)) {
      return false;
    }
  }

  if (query.org.length > 0) {
    const orgKey = row.organizationId ?? NONE_FILTER_VALUE;
    if (!query.org.includes(orgKey)) {
      return false;
    }
  }

  if (query.category.length > 0) {
    const categories = row.categories ?? [];
    if (!query.category.some((category) => categories.includes(category))) {
      return false;
    }
  }

  if (query.state.length > 0 && !query.state.includes(row.stateKey)) {
    return false;
  }

  return true;
}

async function loadMasterEvents() {
  return db.query.events.findMany({
    where: isNull(events.canonicalEventId),
    with: {
      source: true,
      organization: true,
      venue: true,
      overrides: true,
    },
  });
}

async function loadMergedMasterEvents(): Promise<AdminEventRow[]> {
  const rows = (await loadMasterEvents()) as AdminEventRow[];
  const merged = await mergeMastersWithMasterOverrides(
    rows as unknown as EventMaster[],
  );
  return merged as unknown as AdminEventRow[];
}

export async function getAdminEventsFilterOptions(): Promise<AdminEventsFilterOptions> {
  const [rows, tagMetadata] = await Promise.all([
    loadMergedMasterEvents(),
    loadEventCategoryTagMetadataMap(),
  ]);

  const venues = new Map<string, AdminEventFilterOption>();
  const organizations = new Map<string, AdminEventFilterOption>();
  const categories = new Set<string>();
  let hasUnassignedVenue = false;
  let hasUnassignedOrg = false;

  for (const event of rows) {
    if (event.venueId && event.venue) {
      venues.set(event.venueId, {
        value: event.venueId,
        label: event.venue.name,
      });
    } else if (event.locationRaw) {
      hasUnassignedVenue = true;
    } else {
      hasUnassignedVenue = true;
    }

    if (event.organizationId && event.organization) {
      organizations.set(event.organizationId, {
        value: event.organizationId,
        label: event.organization.name,
      });
    } else {
      hasUnassignedOrg = true;
    }

    event.categories?.forEach((category) => {
      const trimmed = category.trim();
      if (trimmed) {
        categories.add(trimmed);
      }
    });
  }

  const venueOptions = sortOptions([...venues.values()]);
  if (hasUnassignedVenue) {
    venueOptions.unshift({ value: NONE_FILTER_VALUE, label: "Sans lieu assigné" });
  }

  const organizationOptions = sortOptions([...organizations.values()]);
  if (hasUnassignedOrg) {
    organizationOptions.unshift({
      value: NONE_FILTER_VALUE,
      label: "Sans organisateur",
    });
  }

  const categoryGroups = buildGroupedCategoryFilterOptions(
    categories,
    tagMetadata,
  );

  return {
    venues: venueOptions,
    organizations: organizationOptions,
    categories: sortOptions(
      flattenGroupedCategoryFilterOptions(categoryGroups),
    ),
    categoryGroups,
    states: ADMIN_EVENT_STATE_OPTIONS,
  };
}

export async function listAdminEventsTable(
  query: AdminEventsQuery,
  options?: { pageSize?: number },
): Promise<AdminEventsTableResult> {
  const pageSize = options?.pageSize ?? ADMIN_EVENTS_PAGE_SIZE;
  const page = Math.max(1, query.page);

  const rows = await loadMergedMasterEvents();
  const recurringMasters = rows.filter((row) =>
    row.recurrenceRule,
  ) as unknown as EventMaster[];
  const nextOccurrenceById = await buildNextOccurrenceMap(recurringMasters);

  const tableRows = sortEventsForAdmin(rows, nextOccurrenceById).map(
    ({ row, isUpcoming }) => toTableRow(row, nextOccurrenceById, isUpcoming),
  );

  const filtered = tableRows.filter((row) => matchesFilters(row, query));

  const sorted = query.sort
    ? sortTableRows(filtered, query.sort, query.dir)
    : filtered;

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const slice = sorted.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  return {
    rows: slice,
    page: currentPage,
    pageSize,
    total,
    totalPages,
    query: { ...query, page: currentPage },
  };
}
