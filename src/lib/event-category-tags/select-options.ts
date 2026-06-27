import { collectDistinctEventCategoryTagNames } from "@/lib/event-category-tags/collect";
import { buildGroupedCategoryFilterOptions } from "@/lib/event-category-tags/grouped-options";
import { loadEventCategoryTagMetadataMap } from "@/lib/event-category-tags/metadata";

export async function getEventCategoryTagSelectOptions() {
  const [names, metadata] = await Promise.all([
    collectDistinctEventCategoryTagNames(),
    loadEventCategoryTagMetadataMap(),
  ]);

  return buildGroupedCategoryFilterOptions(names, metadata);
}
