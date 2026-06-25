import { isNull } from "drizzle-orm";

import { db } from "@/db";
import { events, organizations, venues } from "@/db/schema";
import { listPublishedDanceTagsUncached } from "@/lib/event-category-tags/dance-pages";
import { TIME_PRESET_SLUGS } from "@/lib/event-collections/time-presets";
import { listPublishedTagCollectionsUncached } from "@/lib/event-collections/tag-pages";
import { listEventArchiveMonthsUncached } from "@/lib/events/queries";

/** Cache Components require at least one param at build time. */
function withBuildPlaceholder<T>(params: T[], placeholder: T): T[] {
  return params.length > 0 ? params : [placeholder];
}

export async function listStaticEventSlugs(): Promise<string[]> {
  const rows = await db
    .select({ slug: events.slug })
    .from(events)
    .where(isNull(events.canonicalEventId));

  return rows.map((row) => row.slug);
}

export async function listStaticOrganizerSlugs(): Promise<string[]> {
  const rows = await db.select({ slug: organizations.slug }).from(organizations);

  return rows.map((row) => row.slug);
}

export async function listStaticVenueSlugs(): Promise<string[]> {
  const rows = await db
    .select({ slug: venues.slug })
    .from(venues)
    .where(isNull(venues.canonicalVenueId));

  return rows.map((row) => row.slug);
}

export async function listStaticDanceSlugs(): Promise<string[]> {
  const tags = await listPublishedDanceTagsUncached();
  return tags.map((tag) => tag.slug);
}

export async function listStaticArchiveMonthParams(): Promise<
  Array<{ year: string; month: string }>
> {
  const months = await listEventArchiveMonthsUncached();

  return months.map(({ year, month }) => ({
    year: String(year),
    month: String(month).padStart(2, "0"),
  }));
}

export async function generateEventStaticParams() {
  const slugs = await listStaticEventSlugs();
  return withBuildPlaceholder(
    slugs.map((slug) => ({ slug })),
    { slug: "__build_placeholder__" },
  );
}

export async function generateOrganizerStaticParams() {
  const slugs = await listStaticOrganizerSlugs();
  return withBuildPlaceholder(
    slugs.map((slug) => ({ slug })),
    { slug: "__build_placeholder__" },
  );
}

export async function generateVenueStaticParams() {
  const slugs = await listStaticVenueSlugs();
  return withBuildPlaceholder(
    slugs.map((slug) => ({ slug })),
    { slug: "__build_placeholder__" },
  );
}

export async function listStaticEventCollectionSlugs(): Promise<string[]> {
  const eventTags = await listPublishedTagCollectionsUncached("evenement");
  return [...TIME_PRESET_SLUGS, ...eventTags.map((tag) => tag.slug)];
}

export async function generateEventCollectionStaticParams() {
  const slugs = await listStaticEventCollectionSlugs();
  return withBuildPlaceholder(
    slugs.map((slug) => ({ slug })),
    { slug: "__build_placeholder__" },
  );
}

export async function generateDanceStaticParams() {
  const slugs = await listStaticDanceSlugs();
  return withBuildPlaceholder(
    slugs.map((slug) => ({ slug })),
    { slug: "__build_placeholder__" },
  );
}

export async function generateArchiveMonthStaticParams() {
  const months = await listStaticArchiveMonthParams();

  return withBuildPlaceholder(
    months.map(({ year, month }) => ({
      slug: String(year),
      month: String(month).padStart(2, "0"),
    })),
    { slug: "1970", month: "01" },
  );
}
