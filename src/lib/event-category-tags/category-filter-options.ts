export type CategoryFilterOption = {
  value: string;
  label: string;
};

export type GroupedCategoryFilterOptions = {
  groupLabel: string;
  options: CategoryFilterOption[];
}[];

export function flattenGroupedCategoryFilterOptions(
  groups: GroupedCategoryFilterOptions,
): CategoryFilterOption[] {
  return groups.flatMap((group) => group.options);
}
