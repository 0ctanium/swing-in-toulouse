import { inArray } from "drizzle-orm";

import { db } from "@/db";
import { eventCategoryTags, type EventCategoryTagType } from "@/db/schema";
import { DEFAULT_EVENT_CATEGORY_TAG_TYPE } from "@/lib/event-category-tags/tag-types";

export type EventCategoryTagMetadataMap = Record<string, EventCategoryTagType>;

export async function loadEventCategoryTagMetadataMap(
  names?: string[],
): Promise<EventCategoryTagMetadataMap> {
  const rows =
    names && names.length > 0
      ? await db.query.eventCategoryTags.findMany({
          where: inArray(eventCategoryTags.name, names),
        })
      : await db.query.eventCategoryTags.findMany();

  const map: EventCategoryTagMetadataMap = {};

  for (const row of rows) {
    map[row.name] = row.tagType;
  }

  return map;
}

export function resolveEventCategoryTagType(
  name: string,
  metadata: EventCategoryTagMetadataMap,
): EventCategoryTagType {
  return metadata[name] ?? DEFAULT_EVENT_CATEGORY_TAG_TYPE;
}
