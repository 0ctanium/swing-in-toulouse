import { cacheLife, cacheTag } from "next/cache";
import { cache } from "react";

import { db } from "@/db";
import { CACHE_TAGS } from "@/lib/cache/tags";
import { PUBLIC_PAGE_REVALIDATE } from "@/lib/cache/revalidate";
import {
  buildGroupedCategoryFilterOptions,
  flattenGroupedCategoryFilterOptions,
  type GroupedCategoryFilterOptions,
} from "@/lib/event-category-tags/grouped-options";
import { loadEventCategoryTagMetadataMap } from "@/lib/event-category-tags/metadata";
import {
  listDistinctCategoriesInProjectionWindow,
  listDistinctOrganizationIdsInProjectionWindow,
  listDistinctVenueIdsInProjectionWindow,
  loadOrganizationsByIds,
  loadVenuesByIds,
} from "@/lib/events/occurrence-queries";
import { getProjectionWindow } from "@/lib/events/projection-window";
import { loadVenueCanonicalMap } from "@/lib/venues/canonical";

export type AgendaFilterOption = {
  value: string;
  label: string;
};

export type AgendaFilterOptions = {
  categories: AgendaFilterOption[];
  categoryGroups: GroupedCategoryFilterOptions;
  venues: AgendaFilterOption[];
  organizations: AgendaFilterOption[];
  venueSlugById: Record<string, string>;
};

function sortOptions(options: AgendaFilterOption[]) {
  return options.sort((left, right) =>
    left.label.localeCompare(right.label, "fr"),
  );
}

export async function getAgendaFilterOptionsUncached(): Promise<AgendaFilterOptions> {
  const window = getProjectionWindow();

  const [
    categories,
    venueIds,
    organizationIds,
    allVenues,
    canonicalMap,
    tagMetadata,
  ] = await Promise.all([
    listDistinctCategoriesInProjectionWindow(window),
    listDistinctVenueIdsInProjectionWindow(window),
    listDistinctOrganizationIdsInProjectionWindow(window),
    db.query.venues.findMany({
      columns: { id: true, slug: true },
    }),
    loadVenueCanonicalMap(),
    loadEventCategoryTagMetadataMap(),
  ]);

  const [venuesInWindow, organizations] = await Promise.all([
    loadVenuesByIds(venueIds),
    loadOrganizationsByIds(organizationIds),
  ]);

  const venueSlugById: Record<string, string> = {};

  for (const venue of allVenues) {
    const canonicalId = canonicalMap.resolve(venue.id);
    const canonicalVenue =
      allVenues.find((candidate) => candidate.id === canonicalId) ?? venue;
    venueSlugById[venue.id] = canonicalVenue.slug;
  }

  const categoryGroups = buildGroupedCategoryFilterOptions(
    new Set(categories),
    tagMetadata,
  );

  return {
    categories: sortOptions(flattenGroupedCategoryFilterOptions(categoryGroups)),
    categoryGroups,
    venues: sortOptions(
      venuesInWindow.map((venue) => ({
        value: venue.slug,
        label: venue.name,
      })),
    ),
    organizations: sortOptions(
      organizations.map((organization) => ({
        value: organization.slug,
        label: organization.name,
      })),
    ),
    venueSlugById,
  };
}

async function getAgendaFilterOptionsCached() {
  "use cache";
  cacheLife({
    stale: PUBLIC_PAGE_REVALIDATE,
    revalidate: PUBLIC_PAGE_REVALIDATE,
  });
  cacheTag(
    CACHE_TAGS.agendaFilters,
    CACHE_TAGS.events,
    CACHE_TAGS.categoryTags,
  );

  return getAgendaFilterOptionsUncached();
}

export const getAgendaFilterOptions = cache(getAgendaFilterOptionsCached);
