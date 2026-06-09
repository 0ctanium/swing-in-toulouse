import type { MetadataRoute } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { isNull } from "drizzle-orm";

import { db } from "@/db";
import { events, organizations, venues } from "@/db/schema";
import { CACHE_TAGS } from "@/lib/cache/tags";
import { SITEMAP_REVALIDATE } from "@/lib/cache/revalidate";
import { buildArchiveMonthPath } from "@/lib/events/hub";
import { listEventArchiveMonthsUncached } from "@/lib/events/queries";
import { listPublishedDanceTagsUncached } from "@/lib/event-category-tags/dance-pages";
import { siteConfig } from "@/lib/site";

async function getSitemapData() {
  "use cache";
  cacheLife({
    stale: SITEMAP_REVALIDATE,
    revalidate: SITEMAP_REVALIDATE,
  });
  cacheTag(CACHE_TAGS.events, CACHE_TAGS.organizers, CACHE_TAGS.venues, CACHE_TAGS.categoryTags);

  return Promise.all([
    db
      .select({ slug: events.slug, updatedAt: events.updatedAt })
      .from(events)
      .where(isNull(events.canonicalEventId)),
    db
      .select({ slug: organizations.slug, updatedAt: organizations.updatedAt })
      .from(organizations),
    db
      .select({ slug: venues.slug, updatedAt: venues.updatedAt })
      .from(venues)
      .where(isNull(venues.canonicalVenueId)),
    listPublishedDanceTagsUncached(),
  ]);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [[allEvents, allOrganizations, allVenues, publishedDances], archiveMonths] =
    await Promise.all([getSitemapData(), listEventArchiveMonthsUncached()]);

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: siteConfig.url,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteConfig.url}/agenda`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteConfig.url}/evenements`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteConfig.url}/organisateurs`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${siteConfig.url}/lieux`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${siteConfig.url}/danse`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${siteConfig.url}/mentions-legales`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${siteConfig.url}/confidentialite`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  return [
    ...staticRoutes,
    ...archiveMonths.map((month) => ({
      url: `${siteConfig.url}${buildArchiveMonthPath(month.year, month.month)}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
    ...allEvents.map((event) => ({
      url: `${siteConfig.url}/evenement/${event.slug}`,
      lastModified: event.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...allOrganizations.map((organization) => ({
      url: `${siteConfig.url}/organisateur/${organization.slug}`,
      lastModified: organization.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...allVenues.map((venue) => ({
      url: `${siteConfig.url}/lieu/${venue.slug}`,
      lastModified: venue.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
    ...publishedDances.map((dance) => ({
      url: `${siteConfig.url}/danse/${dance.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
