import { useQuery } from "@tanstack/react-query";

import { adminQueryKeys } from "@/lib/admin/query-keys";
import { fetchJson } from "@/lib/api/fetch-json";
import type { GroupedCategoryFilterOptions } from "@/lib/event-category-tags/grouped-options";

type CategoryTagOptionsResponse = {
  categoryGroups: GroupedCategoryFilterOptions;
};

async function fetchEventCategoryTagOptions() {
  const data = await fetchJson<CategoryTagOptionsResponse>(
    "/api/admin/category-tag-options",
    { credentials: "same-origin" },
    "Impossible de charger les catégories.",
  );

  return data.categoryGroups;
}

export function useEventCategoryTagOptions(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [...adminQueryKeys.categoryTags(), "options"] as const,
    queryFn: fetchEventCategoryTagOptions,
    staleTime: 5 * 60 * 1000,
    enabled: options?.enabled ?? true,
  });
}
