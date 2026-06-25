import { cacheLife, cacheTag } from "next/cache";
import { and, asc, eq, isNotNull } from "drizzle-orm";
import { cache } from "react";

import { db } from "@/db";
import { eventCategoryTags } from "@/db/schema";
import { CACHE_TAGS } from "@/lib/cache/tags";
import { PUBLIC_PAGE_REVALIDATE } from "@/lib/cache/revalidate";
import { getUpcomingEventsUncached } from "@/lib/events/queries";
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

type DanceTagRow = {
  name: string;
  slug: string | null;
  subtitle: string | null;
  description: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  heroTitleBefore: string | null;
  heroTitleEmphasis: string | null;
  heroTitleAfter: string | null;
};

function toPublishedDanceTag(row: DanceTagRow): PublishedDanceTag | null {
  if (!row.slug) {
    return null;
  }

  return {
    name: row.name,
    slug: row.slug,
    subtitle: row.subtitle,
    description: row.description,
    seoTitle: row.seoTitle,
    seoDescription: row.seoDescription,
    heroTitleBefore: row.heroTitleBefore,
    heroTitleEmphasis: row.heroTitleEmphasis,
    heroTitleAfter: row.heroTitleAfter,
  };
}

export function dancePageTitle(
  tag: Pick<PublishedDanceTag, "name" | "seoTitle"> & Partial<DanceHeroTitleFields>,
) {
  return tag.seoTitle ?? formatDanceHeroTitlePlain(tag.name, tag);
}

export function dancePageDescription(
  tag: Pick<PublishedDanceTag, "name" | "seoDescription" | "description">,
) {
  return (
    tag.seoDescription ??
    tag.description ??
    `Soirées, cours et stages de ${tag.name} à Toulouse et en Occitanie.`
  );
}

export function agendaCategoryUrl(categoryName: string) {
  const params = new URLSearchParams();
  params.append("category", categoryName);
  return `/agenda?${params.toString()}`;
}

export async function listPublishedDanceTagsUncached(): Promise<PublishedDanceTag[]> {
  const rows = await db.query.eventCategoryTags.findMany({
    where: and(
      eq(eventCategoryTags.tagType, "danse"),
      eq(eventCategoryTags.isPublished, true),
      isNotNull(eventCategoryTags.slug),
    ),
    columns: {
      name: true,
      slug: true,
      subtitle: true,
      description: true,
      seoTitle: true,
      seoDescription: true,
      heroTitleBefore: true,
      heroTitleEmphasis: true,
      heroTitleAfter: true,
    },
    orderBy: asc(eventCategoryTags.name),
  });

  return rows
    .map(toPublishedDanceTag)
    .filter((row): row is PublishedDanceTag => row !== null);
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

async function getPublishedDanceTagBySlugUncached(
  slug: string,
): Promise<PublishedDanceTag | null> {
  const row = await db.query.eventCategoryTags.findFirst({
    where: and(
      eq(eventCategoryTags.slug, slug),
      eq(eventCategoryTags.tagType, "danse"),
      eq(eventCategoryTags.isPublished, true),
    ),
    columns: {
      name: true,
      slug: true,
      subtitle: true,
      description: true,
      seoTitle: true,
      seoDescription: true,
      heroTitleBefore: true,
      heroTitleEmphasis: true,
      heroTitleAfter: true,
    },
  });

  if (!row) {
    return null;
  }

  return toPublishedDanceTag(row);
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

export type DanceTagPageData = PublishedDanceTag & {
  events: Awaited<ReturnType<typeof getUpcomingEventsUncached>>;
};

async function getDanceTagPageUncached(
  slug: string,
): Promise<DanceTagPageData | null> {
  const tag = await getPublishedDanceTagBySlugUncached(slug);

  if (!tag) {
    return null;
  }

  const events = await getDanceUpcomingEventsUncached(slug);

  return { ...tag, events };
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
  const tag = await getPublishedDanceTagBySlugUncached(slug);

  if (!tag) {
    return [];
  }

  return getUpcomingEventsUncached({
    categoryName: tag.name,
  });
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
