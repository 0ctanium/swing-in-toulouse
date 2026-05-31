import type { EventCategoryTagType } from "@/db/schema";
import { eventCategoryTagTypeEnum } from "@/db/schema";

export const eventCategoryTagTypeValues = eventCategoryTagTypeEnum.enumValues;

export const DEFAULT_EVENT_CATEGORY_TAG_TYPE: EventCategoryTagType = "autre";

export const eventCategoryTagTypeLabels: Record<EventCategoryTagType, string> = {
  danse: "Danse",
  evenement: "Événement",
  autre: "Autre",
};

/** Display order for grouped category selects. */
export const eventCategoryTagTypeOrder: EventCategoryTagType[] = [
  "danse",
  "evenement",
  "autre",
];

export function formatEventCategoryTagType(
  tagType: EventCategoryTagType | null | undefined,
) {
  if (!tagType) {
    return eventCategoryTagTypeLabels[DEFAULT_EVENT_CATEGORY_TAG_TYPE];
  }

  return eventCategoryTagTypeLabels[tagType];
}

export function eventCategoryTagTypeOptions() {
  return eventCategoryTagTypeValues.map((value) => ({
    value,
    label: eventCategoryTagTypeLabels[value],
  }));
}
