import type { VenueCategory } from "@/db/schema";
import { venueCategoryEnum } from "@/db/schema";

export const venueCategoryValues = venueCategoryEnum.enumValues;

export const venueCategoryLabels: Record<VenueCategory, string> = {
  school: "École",
  bar: "Bar / Guinguette",
  hall: "Salle",
  exterior: "Extérieur",
  association: "Association",
  other: "Autre",
};

export function formatVenueCategory(category: VenueCategory | null | undefined) {
  if (!category) {
    return null;
  }

  return venueCategoryLabels[category];
}

export function venueCategoryOptions() {
  return venueCategoryValues.map((value) => ({
    value,
    label: venueCategoryLabels[value],
  }));
}
