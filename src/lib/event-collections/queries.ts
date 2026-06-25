import { cacheLife, cacheTag } from "next/cache";
import { cache } from "react";

import { CACHE_TAGS } from "@/lib/cache/tags";
import { PUBLIC_PAGE_REVALIDATE } from "@/lib/cache/revalidate";
import { getUpcomingEventsUncached } from "@/lib/events/queries";

import { resolveEvenementsCollectionSlug } from "@/lib/event-collections/resolve";
import {
  getTimePresetEmptyMessage,
  listTimePresetDefinitions,
  timePresetToCollection,
} from "@/lib/event-collections/time-presets";
import {
  getPublishedTagCollectionUncached,
  listPublishedTagCollectionsUncached,
} from "@/lib/event-collections/tag-pages";
import type {
  EventCollection,
  PublishableTagType,
} from "@/lib/event-collections/types";

export type CollectionPageData = EventCollection & {
  events: Awaited<ReturnType<typeof getUpcomingEventsUncached>>;
  emptyMessage: string;
};

function collectionEmptyMessage(collection: EventCollection) {
  if (collection.kind === "time-preset") {
    return getTimePresetEmptyMessage(collection.slug);
  }

  return `Aucun événement ${collection.label} à venir pour le moment.`;
}

export async function getCollectionEventsUncached(collection: EventCollection) {
  return getUpcomingEventsUncached({
    categoryName: collection.filters.categoryName,
    from: collection.filters.from,
    to: collection.filters.to,
  });
}

async function buildCollectionPageData(
  collection: EventCollection,
): Promise<CollectionPageData> {
  const events = await getCollectionEventsUncached(collection);

  return {
    ...collection,
    events,
    emptyMessage: collectionEmptyMessage(collection),
  };
}

export async function getEvenementsCollectionPageUncached(
  slug: string,
): Promise<CollectionPageData | null> {
  const collection = await resolveEvenementsCollectionSlug(slug);

  if (!collection) {
    return null;
  }

  return buildCollectionPageData(collection);
}

async function getEvenementsCollectionPageCached(slug: string) {
  "use cache";
  cacheLife({
    stale: PUBLIC_PAGE_REVALIDATE,
    revalidate: PUBLIC_PAGE_REVALIDATE,
  });
  cacheTag(
    CACHE_TAGS.categoryTags,
    CACHE_TAGS.events,
    `evenements-collection-${slug}`,
  );

  return getEvenementsCollectionPageUncached(slug);
}

export const getEvenementsCollectionPage = cache(
  getEvenementsCollectionPageCached,
);

export async function getTagCollectionPageUncached(
  slug: string,
  tagType: PublishableTagType,
): Promise<CollectionPageData | null> {
  const collection = await getPublishedTagCollectionUncached(slug, tagType);

  if (!collection) {
    return null;
  }

  return buildCollectionPageData(collection);
}

async function getTagCollectionPageCached(
  slug: string,
  tagType: PublishableTagType,
) {
  "use cache";
  cacheLife({
    stale: PUBLIC_PAGE_REVALIDATE,
    revalidate: PUBLIC_PAGE_REVALIDATE,
  });
  cacheTag(
    CACHE_TAGS.categoryTags,
    CACHE_TAGS.events,
    `tag-collection-page-${tagType}-${slug}`,
  );

  return getTagCollectionPageUncached(slug, tagType);
}

export const getTagCollectionPage = cache(getTagCollectionPageCached);

export async function listEvenementsHubCollectionsUncached() {
  const eventTags = await listPublishedTagCollectionsUncached("evenement");

  return {
    timePresets: listTimePresetDefinitions().map((preset) =>
      timePresetToCollection(preset),
    ),
    eventTags,
  };
}

async function listEvenementsHubCollectionsCached() {
  "use cache";
  cacheLife({
    stale: PUBLIC_PAGE_REVALIDATE,
    revalidate: PUBLIC_PAGE_REVALIDATE,
  });
  cacheTag(CACHE_TAGS.categoryTags, "evenements-hub-collections");

  return listEvenementsHubCollectionsUncached();
}

export const listEvenementsHubCollections = cache(
  listEvenementsHubCollectionsCached,
);
