import { cacheLife, cacheTag } from "next/cache";
import { cache } from "react";

import { CACHE_TAGS } from "@/lib/cache/tags";
import { PUBLIC_PAGE_REVALIDATE } from "@/lib/cache/revalidate";
import {
  collectionPageDescription,
  collectionPageTitle,
} from "@/lib/event-collections/metadata";
import {
  getTagCollectionPageUncached,
  type CollectionPageData,
} from "@/lib/event-collections/queries";
import {
  getPublishedTagCollection,
  getPublishedTagCollectionUncached,
  listPublishedTagCollections,
  listPublishedTagCollectionsUncached,
} from "@/lib/event-collections/tag-pages";
import { agendaUrlForCollection } from "@/lib/event-collections/urls";
import {
  formatDanceHeroTitlePlain,
  type DanceHeroTitleFields,
} from "@/lib/event-category-tags/hero-title";

export type PublishedDanceTag = {
  name: string;
  slug: string;
  subtitle: string | null;
  description: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
} & DanceHeroTitleFields;

export type DanceTagPageData = PublishedDanceTag & {
  events: CollectionPageData["events"];
};

function collectionToPublishedDanceTag(
  collection: Awaited<ReturnType<typeof getPublishedTagCollectionUncached>>,
): PublishedDanceTag | null {
  if (!collection) {
    return null;
  }

  return {
    name: collection.label,
    slug: collection.slug,
    subtitle: collection.subtitle,
    description: collection.description,
    seoTitle: collection.seoTitle,
    seoDescription: collection.seoDescription,
    heroTitleBefore: collection.heroTitleBefore,
    heroTitleEmphasis: collection.heroTitleEmphasis,
    heroTitleAfter: collection.heroTitleAfter,
  };
}

export function dancePageTitle(
  tag: Pick<PublishedDanceTag, "name" | "seoTitle"> & Partial<DanceHeroTitleFields>,
) {
  return (
    tag.seoTitle ??
    formatDanceHeroTitlePlain(tag.name, tag)
  );
}

export function dancePageDescription(
  tag: Pick<PublishedDanceTag, "name" | "seoDescription" | "description">,
) {
  return collectionPageDescription({
    kind: "tag",
    tagType: "danse",
    label: tag.name,
    seoDescription: tag.seoDescription,
    description: tag.description,
  });
}

export function agendaCategoryUrl(categoryName: string) {
  return agendaUrlForCollection({ categoryName });
}

export async function listPublishedDanceTagsUncached(): Promise<PublishedDanceTag[]> {
  const collections = await listPublishedTagCollectionsUncached("danse");

  return collections.map((collection) => ({
    name: collection.label,
    slug: collection.slug,
    subtitle: collection.subtitle,
    description: collection.description,
    seoTitle: collection.seoTitle,
    seoDescription: collection.seoDescription,
    heroTitleBefore: collection.heroTitleBefore,
    heroTitleEmphasis: collection.heroTitleEmphasis,
    heroTitleAfter: collection.heroTitleAfter,
  }));
}

async function listPublishedDanceTagsCached() {
  "use cache";
  cacheLife({
    stale: PUBLIC_PAGE_REVALIDATE,
    revalidate: PUBLIC_PAGE_REVALIDATE,
  });
  cacheTag(CACHE_TAGS.categoryTags);

  return listPublishedDanceTagsUncached();
}

export const listPublishedDanceTags = cache(listPublishedDanceTagsCached);

export async function getPublishedDanceTagBySlugUncached(
  slug: string,
): Promise<PublishedDanceTag | null> {
  const collection = await getPublishedTagCollectionUncached(slug, "danse");
  return collectionToPublishedDanceTag(collection);
}

async function getPublishedDanceTagBySlugCached(slug: string) {
  "use cache";
  cacheLife({
    stale: PUBLIC_PAGE_REVALIDATE,
    revalidate: PUBLIC_PAGE_REVALIDATE,
  });
  cacheTag(CACHE_TAGS.categoryTags, `dance-tag-${slug}`);

  return getPublishedDanceTagBySlugUncached(slug);
}

export const getPublishedDanceTagBySlug = cache(getPublishedDanceTagBySlugCached);

export async function getDanceTagPageUncached(
  slug: string,
): Promise<DanceTagPageData | null> {
  const page = await getTagCollectionPageUncached(slug, "danse");

  if (!page) {
    return null;
  }

  const tag = collectionToPublishedDanceTag(page);

  if (!tag) {
    return null;
  }

  return {
    ...tag,
    events: page.events,
  };
}

async function getDanceTagPageCached(slug: string) {
  "use cache";
  cacheLife({
    stale: PUBLIC_PAGE_REVALIDATE,
    revalidate: PUBLIC_PAGE_REVALIDATE,
  });
  cacheTag(CACHE_TAGS.categoryTags, CACHE_TAGS.events, `dance-tag-${slug}`);

  return getDanceTagPageUncached(slug);
}

export const getDanceTagPage = cache(getDanceTagPageCached);

export async function getDanceUpcomingEventsUncached(slug: string) {
  const page = await getTagCollectionPageUncached(slug, "danse");
  return page?.events ?? [];
}

async function getDanceUpcomingEventsCached(slug: string) {
  "use cache";
  cacheLife({
    stale: PUBLIC_PAGE_REVALIDATE,
    revalidate: PUBLIC_PAGE_REVALIDATE,
  });
  cacheTag(CACHE_TAGS.categoryTags, CACHE_TAGS.events, `dance-events-${slug}`);

  return getDanceUpcomingEventsUncached(slug);
}

export const getDanceUpcomingEvents = cache(getDanceUpcomingEventsCached);

export {
  collectionPageDescription,
  collectionPageTitle,
  getPublishedTagCollection,
  listPublishedTagCollections,
};
