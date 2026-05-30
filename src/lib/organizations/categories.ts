import type { OrganizationCategory } from "@/db/schema";
import { organizationCategoryEnum } from "@/db/schema";

export const organizationCategoryValues = organizationCategoryEnum.enumValues;

export const organizationCategoryLabels: Record<
  OrganizationCategory,
  string
> = {
  school: "École",
  association: "Association",
};

export function formatOrganizationCategory(
  category: OrganizationCategory | null | undefined,
) {
  if (!category) {
    return null;
  }

  return organizationCategoryLabels[category];
}

export function organizationCategoryOptions() {
  return organizationCategoryValues.map((value) => ({
    value,
    label: organizationCategoryLabels[value],
  }));
}
