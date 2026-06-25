import { cacheLife, cacheTag } from "next/cache";
import { and, asc, eq, inArray, isNotNull } from "drizzle-orm";
import { cache } from "react";

import { db } from "@/db";
import { eventCategoryTags } from "@/db/schema";
import { CACHE_TAGS } from "@/lib/cache/tags";
import { PUBLIC_PAGE_REVALIDATE } from "@/lib/cache/revalidate";
import { defaultHeroTitleForTag } from "@/lib/event-collections/metadata";
import {
  isPublishableTagType,
  PUBLISHABLE_TAG_TYPES,
} from "@/lib/event-category-tags/publishable";
import type {
  EventCollection,
  PublishableTagType,
} from "@/lib/event-collections/types";
import { tagCollectionPath } from "@/lib/event-collections/urls";

export { isPublishableTagType, PUBLISHABLE_TAG_TYPES };

type PublishedTagRow = {
  name: string;
  slug: string | null;
  tagType: PublishableTagType;
  subtitle: string | null;
  description: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  heroTitleBefore: string | null;
  heroTitleEmphasis: string | null;
  heroTitleAfter: string | null;
};

const publishedTagColumns = {
  name: true,
  slug: true,
  tagType: true,
  subtitle: true,
  description: true,
  seoTitle: true,
  seoDescription: true,
  heroTitleBefore: true,
  heroTitleEmphasis: true,
  heroTitleAfter: true,
} as const;

function toPublishedTagCollection(row: PublishedTagRow): EventCollection | null {
  if (!row.slug || !isPublishableTagType(row.tagType)) {
    return null;
  }

  return {
    kind: "tag",
    slug: row.slug,
    path: tagCollectionPath(row.tagType, row.slug),
    label: row.name,
    tagType: row.tagType,
    subtitle: row.subtitle,
    description: row.description,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    heroTitleBefore: row.heroTitleBefore,
    heroTitleEmphasis: row.heroTitleEmphasis,
    heroTitleAfter: row.heroTitleAfter,
    filters: {
      categoryName: row.name,
    },
  };
}

export async function listPublishedTagCollectionsUncached(
  tagType?: PublishableTagType,
): Promise<EventCollection[]> {
  const rows = await db.query.eventCategoryTags.findMany({
    where: and(
      tagType
        ? eq(eventCategoryTags.tagType, tagType)
        : inArray(eventCategoryTags.tagType, PUBLISHABLE_TAG_TYPES),
      eq(eventCategoryTags.isPublished, true),
      isNotNull(eventCategoryTags.slug),
    ),
    columns: publishedTagColumns,
    orderBy: asc(eventCategoryTags.name),
  });

  return rows
    .map((row) => toPublishedTagCollection(row as PublishedTagRow))
    .filter((row): row is EventCollection => row !== null);
}

async function listPublishedTagCollectionsCached(tagType?: PublishableTagType) {
  "use cache";
  cacheLife({
    stale: PUBLIC_PAGE_REVALIDATE,
    revalidate: PUBLIC_PAGE_REVALIDATE,
  });
  cacheTag(
    CACHE_TAGS.categoryTags,
    tagType ? `tag-collections-${tagType}` : "tag-collections",
  );

  return listPublishedTagCollectionsUncached(tagType);
}

export const listPublishedTagCollections = cache(listPublishedTagCollectionsCached);

export async function getPublishedTagCollectionUncached(
  slug: string,
  tagType: PublishableTagType,
): Promise<EventCollection | null> {
  const row = await db.query.eventCategoryTags.findFirst({
    where: and(
      eq(eventCategoryTags.slug, slug),
      eq(eventCategoryTags.tagType, tagType),
      eq(eventCategoryTags.isPublished, true),
    ),
    columns: publishedTagColumns,
  });

  if (!row) {
    return null;
  }

  return toPublishedTagCollection(row as PublishedTagRow);
}

async function getPublishedTagCollectionCached(
  slug: string,
  tagType: PublishableTagType,
) {
  "use cache";
  cacheLife({
    stale: PUBLIC_PAGE_REVALIDATE,
    revalidate: PUBLIC_PAGE_REVALIDATE,
  });
  cacheTag(CACHE_TAGS.categoryTags, `tag-collection-${tagType}-${slug}`);

  return getPublishedTagCollectionUncached(slug, tagType);
}

export const getPublishedTagCollection = cache(getPublishedTagCollectionCached);

export function publishedTagDefaults(name: string, tagType: PublishableTagType) {
  const hero = defaultHeroTitleForTag(tagType, name);

  return {
    heroTitleBefore: hero.heroTitleBefore,
    heroTitleEmphasis: hero.heroTitleEmphasis,
    heroTitleAfter: hero.heroTitleAfter,
  };
}
