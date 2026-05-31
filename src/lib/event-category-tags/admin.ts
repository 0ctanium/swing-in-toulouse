import { sql } from "drizzle-orm";

import { db } from "@/db";
import { eventCategoryTags, type EventCategoryTagType } from "@/db/schema";
import { collectDistinctEventCategoryTagNames } from "@/lib/event-category-tags/collect";
import { loadEventCategoryTagMetadataMap } from "@/lib/event-category-tags/metadata";
import { DEFAULT_EVENT_CATEGORY_TAG_TYPE } from "@/lib/event-category-tags/tag-types";

export const ADMIN_CATEGORY_TAGS_PAGE_SIZE = 20;

export type AdminCategoryTagRow = {
  name: string;
  tagType: EventCategoryTagType;
  hasMetadata: boolean;
};

export type AdminCategoryTagsListResult = {
  rows: AdminCategoryTagRow[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  search: string;
};

function matchesSearch(name: string, search: string) {
  if (!search) {
    return true;
  }

  return name.toLocaleLowerCase("fr").includes(search.toLocaleLowerCase("fr"));
}

export async function listAdminCategoryTags(options: {
  page?: number;
  pageSize?: number;
  search?: string;
}): Promise<AdminCategoryTagsListResult> {
  const pageSize = options.pageSize ?? ADMIN_CATEGORY_TAGS_PAGE_SIZE;
  const page = Math.max(1, options.page ?? 1);
  const search = options.search?.trim() ?? "";

  const [allNames, metadata] = await Promise.all([
    collectDistinctEventCategoryTagNames(),
    loadEventCategoryTagMetadataMap(),
  ]);

  const filtered = allNames.filter((name) => matchesSearch(name, search));

  const rows: AdminCategoryTagRow[] = filtered.map((name) => ({
    name,
    tagType: metadata[name] ?? DEFAULT_EVENT_CATEGORY_TAG_TYPE,
    hasMetadata: name in metadata,
  }));

  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const slice = rows.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  return {
    rows: slice,
    page: currentPage,
    pageSize,
    total,
    totalPages,
    search,
  };
}

export async function upsertCategoryTagMetadata(
  name: string,
  tagType: EventCategoryTagType,
) {
  const trimmed = name.trim();

  if (!trimmed) {
    throw new Error("Nom de tag invalide.");
  }

  const [row] = await db
    .insert(eventCategoryTags)
    .values({ name: trimmed, tagType })
    .onConflictDoUpdate({
      target: eventCategoryTags.name,
      set: { tagType, updatedAt: sql`now()` },
    })
    .returning();

  return row;
}
