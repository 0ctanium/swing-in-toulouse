import type { EventCategoryTagType } from "@/db/schema";
import {
  eventCategoryTagTypeLabels,
  eventCategoryTagTypeOrder,
} from "@/lib/event-category-tags/tag-types";
import type { EventCategoryTagMetadataMap } from "@/lib/event-category-tags/metadata";
import { resolveEventCategoryTagType } from "@/lib/event-category-tags/metadata";

export type CategoryFilterOption = {
  value: string;
  label: string;
};

export type GroupedCategoryFilterOptions = {
  groupLabel: string;
  options: CategoryFilterOption[];
}[];

export function buildGroupedCategoryFilterOptions(
  names: Iterable<string>,
  metadata: EventCategoryTagMetadataMap,
): GroupedCategoryFilterOptions {
  const buckets = new Map<EventCategoryTagType, CategoryFilterOption[]>();

  for (const tagType of eventCategoryTagTypeOrder) {
    buckets.set(tagType, []);
  }

  const uniqueNames = [...new Set(names)].sort((left, right) =>
    left.localeCompare(right, "fr"),
  );

  for (const name of uniqueNames) {
    const tagType = resolveEventCategoryTagType(name, metadata);
    buckets.get(tagType)?.push({ value: name, label: name });
  }

  return eventCategoryTagTypeOrder
    .map((tagType) => ({
      groupLabel: eventCategoryTagTypeLabels[tagType],
      options: buckets.get(tagType) ?? [],
    }))
    .filter((group) => group.options.length > 0);
}

export function flattenGroupedCategoryFilterOptions(
  groups: GroupedCategoryFilterOptions,
): CategoryFilterOption[] {
  return groups.flatMap((group) => group.options);
}
