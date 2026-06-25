import { cacheLife, cacheTag } from "next/cache";

import { CACHE_TAGS } from "@/lib/cache/tags";
import { PUBLIC_PAGE_REVALIDATE } from "@/lib/cache/revalidate";
import { formatEventDate } from "@/lib/events/format";
import { getUpcomingEvents } from "@/lib/events/queries";
import type { EventOccurrence } from "@/lib/ical/recurrence";
import { getDefaultExpansionWindow } from "@/lib/ical/recurrence";
import { absoluteUrl, eventUrl, siteConfig } from "@/lib/site";

export const EVENT_FEED_PATH = "/feed.xml";
export const EVENT_FEED_ITEM_LIMIT = 50;

export function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function formatAtomDate(date: Date) {
  return date.toISOString();
}

function getEventLocationLabel(event: EventOccurrence) {
  if (event.venue?.name) {
    return event.venue.name;
  }

  if (event.locationRaw?.trim()) {
    return event.locationRaw.trim();
  }

  return null;
}

function buildEventEntryContent(event: EventOccurrence) {
  const parts = [
    `<p><strong>${escapeXml(formatEventDate(event.startAt, event.endAt, event.isAllDay))}</strong></p>`,
  ];

  if (event.organization?.name) {
    parts.push(`<p>Organisateur : ${escapeXml(event.organization.name)}</p>`);
  }

  const location = getEventLocationLabel(event);

  if (location) {
    parts.push(`<p>Lieu : ${escapeXml(location)}</p>`);
  }

  if (event.categories?.length) {
    parts.push(
      `<p>Styles : ${escapeXml(event.categories.join(", "))}</p>`,
    );
  }

  if (event.description?.trim()) {
    parts.push(`<p>${escapeXml(event.description.trim())}</p>`);
  }

  return parts.join("\n");
}

function buildEventEntrySummary(event: EventOccurrence) {
  const details = [
    formatEventDate(event.startAt, event.endAt, event.isAllDay),
    event.organization?.name,
    getEventLocationLabel(event),
  ].filter(Boolean);

  if (event.description?.trim()) {
    details.push(event.description.trim());
  }

  return details.join(" · ");
}

export function buildAtomEntryId(event: EventOccurrence) {
  return `${eventUrl(event.slug)}#${encodeURIComponent(event.id)}`;
}

export function serializeAtomFeed(occurrences: EventOccurrence[], generatedAt = new Date()) {
  const feedUrl = absoluteUrl(EVENT_FEED_PATH);
  const siteUrl = absoluteUrl("/");
  const updatedAt =
    occurrences.length > 0
      ? occurrences.reduce(
          (latest, occurrence) =>
            occurrence.startAt > latest ? occurrence.startAt : latest,
          occurrences[0]!.startAt,
        )
      : generatedAt;

  const entries = occurrences
    .map((event) => {
      const entryUrl = eventUrl(event.slug);
      const summary = buildEventEntrySummary(event);

      return [
        "  <entry>",
        `    <title>${escapeXml(event.title)}</title>`,
        `    <link href="${escapeXml(entryUrl)}" rel="alternate" type="text/html" />`,
        `    <id>${escapeXml(buildAtomEntryId(event))}</id>`,
        `    <updated>${formatAtomDate(event.startAt)}</updated>`,
        `    <published>${formatAtomDate(event.startAt)}</published>`,
        `    <summary type="text">${escapeXml(summary)}</summary>`,
        `    <content type="html">${buildEventEntryContent(event)}</content>`,
        "  </entry>",
      ].join("\n");
    })
    .join("\n");

  return [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="fr">',
    `  <title>${escapeXml(siteConfig.name)}</title>`,
    `  <subtitle>${escapeXml(siteConfig.description)}</subtitle>`,
    `  <link href="${escapeXml(feedUrl)}" rel="self" type="application/atom+xml" />`,
    `  <link href="${escapeXml(siteUrl)}" rel="alternate" type="text/html" />`,
    `  <id>${escapeXml(siteUrl)}</id>`,
    `  <updated>${formatAtomDate(updatedAt)}</updated>`,
    `  <author>`,
    `    <name>${escapeXml(siteConfig.name)}</name>`,
    "  </author>",
    entries,
    "</feed>",
    "",
  ]
    .filter((line) => line.length > 0)
    .join("\n");
}

async function buildEventAtomFeedUncached() {
  const window = getDefaultExpansionWindow();
  const occurrences = await getUpcomingEvents({
    from: window.from,
    to: window.to,
    limit: EVENT_FEED_ITEM_LIMIT,
  });

  return serializeAtomFeed(occurrences);
}

export async function buildEventAtomFeed() {
  "use cache";
  cacheLife({
    stale: PUBLIC_PAGE_REVALIDATE,
    revalidate: PUBLIC_PAGE_REVALIDATE,
  });
  cacheTag(CACHE_TAGS.events);

  return buildEventAtomFeedUncached();
}
