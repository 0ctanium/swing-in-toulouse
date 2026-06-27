import { loadCategoryTagAliasesByTag } from "@/lib/event-category-tags/admin";
import { collectDistinctEventCategoryTagNames } from "@/lib/event-category-tags/collect";
import { buildGroupedCategoryFilterOptions } from "@/lib/event-category-tags/grouped-options";
import { loadEventCategoryTagMetadataMap } from "@/lib/event-category-tags/metadata";

export async function getEventCategoryTagSelectOptions() {
  const [names, metadata, aliasesByTag] = await Promise.all([
    collectDistinctEventCategoryTagNames(),
    loadEventCategoryTagMetadataMap(),
    loadCategoryTagAliasesByTag(),
  ]);

  return {
    categoryGroups: buildGroupedCategoryFilterOptions(names, metadata),
    aliasesByTag,
  };
}
