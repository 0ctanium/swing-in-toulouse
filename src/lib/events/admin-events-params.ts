import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
} from "nuqs/server";

export const ADMIN_EVENT_SORT_COLUMNS = [
  "date",
  "title",
  "venue",
  "org",
  "state",
] as const;

export const ADMIN_EVENT_SORT_DIRS = ["asc", "desc"] as const;

export const ADMIN_EVENT_STATE_FILTERS = [
  "pending",
  "modified",
  "confirmed",
] as const;

export type AdminEventSortColumn = (typeof ADMIN_EVENT_SORT_COLUMNS)[number];
export type AdminEventSortDir = (typeof ADMIN_EVENT_SORT_DIRS)[number];
export type AdminEventStateFilter = (typeof ADMIN_EVENT_STATE_FILTERS)[number];

export type AdminEventsQuery = {
  page: number;
  sort: AdminEventSortColumn | null;
  dir: AdminEventSortDir;
  venue: string[];
  org: string[];
  category: string[];
  state: AdminEventStateFilter[];
};

export const NONE_FILTER_VALUE = "__none__";

export const adminEventsParsers = {
  page: parseAsInteger.withDefault(1),
  sort: parseAsStringLiteral(ADMIN_EVENT_SORT_COLUMNS),
  dir: parseAsStringLiteral(ADMIN_EVENT_SORT_DIRS).withDefault("asc"),
  venue: parseAsArrayOf(parseAsString).withDefault([]),
  org: parseAsArrayOf(parseAsString).withDefault([]),
  category: parseAsArrayOf(parseAsString).withDefault([]),
  state: parseAsArrayOf(
    parseAsStringLiteral(ADMIN_EVENT_STATE_FILTERS),
  ).withDefault([]),
};

export const adminEventsClientParsers = {
  page: parseAsInteger.withDefault(1),
  sort: parseAsStringLiteral(ADMIN_EVENT_SORT_COLUMNS),
  dir: parseAsStringLiteral(ADMIN_EVENT_SORT_DIRS).withDefault("asc"),
  venue: parseAsArrayOf(parseAsString).withDefault([]),
  org: parseAsArrayOf(parseAsString).withDefault([]),
  category: parseAsArrayOf(parseAsString).withDefault([]),
  state: parseAsArrayOf(
    parseAsStringLiteral(ADMIN_EVENT_STATE_FILTERS),
  ).withDefault([]),
};

export function parseAdminEventsSearchParams(
  params: Record<string, string | string[] | undefined>,
): AdminEventsQuery {
  const get = (key: string) => {
    const value = params[key];
    if (Array.isArray(value)) {
      return value[0];
    }
    return value;
  };

  const getAll = (key: string) => {
    const value = params[key];
    if (!value) {
      return [];
    }

    const items = Array.isArray(value) ? value : [value];
    return items.flatMap((item) => item.split(",")).filter(Boolean);
  };

  const pageRaw = get("page");
  const page = pageRaw ? Number.parseInt(pageRaw, 10) : 1;

  const sortRaw = get("sort");
  const sort = ADMIN_EVENT_SORT_COLUMNS.includes(
    sortRaw as AdminEventSortColumn,
  )
    ? (sortRaw as AdminEventSortColumn)
    : null;

  const dirRaw = get("dir");
  const dir = ADMIN_EVENT_SORT_DIRS.includes(dirRaw as AdminEventSortDir)
    ? (dirRaw as AdminEventSortDir)
    : "asc";

  const state = getAll("state").filter((value): value is AdminEventStateFilter =>
    ADMIN_EVENT_STATE_FILTERS.includes(value as AdminEventStateFilter),
  );

  return {
    page: Number.isFinite(page) && page > 0 ? page : 1,
    sort,
    dir,
    venue: getAll("venue"),
    org: getAll("org"),
    category: getAll("category"),
    state,
  };
}

export function hasAdminEventsFilters(query: AdminEventsQuery) {
  return (
    query.venue.length > 0 ||
    query.org.length > 0 ||
    query.category.length > 0 ||
    query.state.length > 0
  );
}
