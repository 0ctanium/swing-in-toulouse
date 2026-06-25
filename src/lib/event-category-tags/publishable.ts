import type { EventCategoryTagType } from "@/db/schema";
import type { PublishableTagType } from "@/lib/event-collections/types";
import { tagCollectionPath } from "@/lib/event-collections/urls";

export const PUBLISHABLE_TAG_TYPES: PublishableTagType[] = ["danse", "evenement"];

export function isPublishableTagType(
  tagType: EventCategoryTagType | string,
): tagType is PublishableTagType {
  return PUBLISHABLE_TAG_TYPES.includes(tagType as PublishableTagType);
}

export function categoryTagPublicPath(
  tagType: EventCategoryTagType,
  slug: string,
) {
  if (!isPublishableTagType(tagType)) {
    return null;
  }

  return tagCollectionPath(tagType, slug);
}
