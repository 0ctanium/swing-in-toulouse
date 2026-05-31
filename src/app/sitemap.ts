import type { MetadataRoute } from "next";

import { isNull } from "drizzle-orm";

import { db } from "@/db";
import { events, organizations, venues } from "@/db/schema";
import { siteConfig } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [allEvents, allOrganizations, allVenues] = await Promise.all([
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
  ]);

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
  ];
}
