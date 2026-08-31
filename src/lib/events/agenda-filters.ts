import { parseAsArrayOf, parseAsString } from "nuqs/server";

import type { EventMaster } from "@/db/schema";
import type { EventOccurrence } from "@/lib/events/queries";

export type AgendaFilters = {
  category: string[];
  venue: string[];
  org: string[];
};

export type AgendaBaseFilters = Partial<AgendaFilters>;

export const emptyAgendaFilters: AgendaFilters = {
  category: [],
  venue: [],
  org: [],
};

export function isFilterDimensionLocked(
  key: keyof AgendaFilters,
  baseFilters?: AgendaBaseFilters,
) {
  const values = baseFilters?.[key];
  return Array.isArray(values) && values.length > 0;
}

export function mergeAgendaFilters(
  userFilters: AgendaFilters,
  baseFilters?: AgendaBaseFilters,
): AgendaFilters {
  if (!baseFilters) {
    return userFilters;
  }

  return {
    category: baseFilters.category ?? userFilters.category,
    venue: baseFilters.venue ?? userFilters.venue,
    org: baseFilters.org ?? userFilters.org,
  };
}

export function applyAgendaFilterPatch(
  userFilters: AgendaFilters,
  patch: Partial<AgendaFilters>,
  baseFilters?: AgendaBaseFilters,
): AgendaFilters {
  const nextFilters = { ...userFilters, ...patch };

  if (!baseFilters) {
    return nextFilters;
  }

  return mergeAgendaFilters(nextFilters, baseFilters);
}

export const agendaFilterParsers = {
  category: parseAsArrayOf(parseAsString),
  venue: parseAsArrayOf(parseAsString),
  org: parseAsArrayOf(parseAsString),
};

export const agendaFilterClientParsers = {
  category: parseAsArrayOf(parseAsString).withDefault([]),
  venue: parseAsArrayOf(parseAsString).withDefault([]),
  org: parseAsArrayOf(parseAsString).withDefault([]),
};

export function hasActiveAgendaFilters(filters: AgendaFilters) {
  return (
    filters.category.length > 0 ||
    filters.venue.length > 0 ||
    filters.org.length > 0
  );
}

export function filterMastersForExport(
  masters: EventMaster[],
  filters: AgendaFilters,
  venueSlugById: Record<string, string> = {},
) {
  if (!hasActiveAgendaFilters(filters)) {
    return masters;
  }

  return masters.filter((master) => {
    if (filters.category.length > 0) {
      const matchesCategory = master.categories?.some((category) =>
        filters.category.includes(category),
      );
      if (!matchesCategory) {
        return false;
      }
    }

    if (filters.venue.length > 0) {
      const venueSlug = master.venue
        ? (venueSlugById[master.venue.id] ?? master.venue.slug)
        : null;
      if (!venueSlug || !filters.venue.includes(venueSlug)) {
        return false;
      }
    }

    if (filters.org.length > 0) {
      if (
        !master.organization ||
        !filters.org.includes(master.organization.slug)
      ) {
        return false;
      }
    }

    return true;
  });
}

export function filterAgendaOccurrences(
  occurrences: EventOccurrence[],
  filters: AgendaFilters,
  venueSlugById: Record<string, string>,
) {
  if (!hasActiveAgendaFilters(filters)) {
    return occurrences;
  }

  return occurrences.filter((occurrence) => {
    if (filters.category.length > 0) {
      const matchesCategory = occurrence.categories?.some((category) =>
        filters.category.includes(category),
      );
      if (!matchesCategory) {
        return false;
      }
    }

    if (filters.venue.length > 0) {
      const venueSlug = occurrence.venue
        ? (venueSlugById[occurrence.venue.id] ?? occurrence.venue.slug)
        : null;
      if (!venueSlug || !filters.venue.includes(venueSlug)) {
        return false;
      }
    }

    if (filters.org.length > 0) {
      if (
        !occurrence.organization ||
        !filters.org.includes(occurrence.organization.slug)
      ) {
        return false;
      }
    }

    return true;
  });
}
