import { useQuery } from "@tanstack/react-query";

import { adminQueryKeys } from "@/lib/admin/query-keys";
import { fetchJson } from "@/lib/api/fetch-json";
import type { GroupedCategoryFilterOptions } from "@/lib/event-category-tags/category-filter-options";
import type { CategoryTagAliasesByTag } from "@/lib/event-category-tags/aliases";

export type EventCategoryTagOptions = {
  categoryGroups: GroupedCategoryFilterOptions;
  aliasesByTag: CategoryTagAliasesByTag;
};

type CategoryTagOptionsResponse = EventCategoryTagOptions;

async function fetchEventCategoryTagOptions() {
  return fetchJson<CategoryTagOptionsResponse>(
    "/api/admin/category-tag-options",
    { credentials: "same-origin" },
    "Impossible de charger les catégories.",
  );
}

export function useEventCategoryTagOptions(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [...adminQueryKeys.categoryTags(), "options"] as const,
    queryFn: fetchEventCategoryTagOptions,
    staleTime: 5 * 60 * 1000,
    enabled: options?.enabled ?? true,
  });
}
