import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { db } from "@/db";
import type { EventMaster } from "@/db/schema";
import { organizations } from "@/db/schema";
import {
  filterMastersForExport,
  hasActiveAgendaFilters,
} from "@/lib/events/agenda-filters";
import { getEventsForExport, resolveEventBySlug } from "@/lib/events/queries";
import {
  getDefaultFromDate,
  isMasterRelevantForExport,
} from "@/lib/ical/recurrence";
import { buildNormalizedEventsForExport } from "@/lib/ical/export-events";
import { hasActiveIcalPayload, type IcalPayload } from "@/lib/ical/payload";
import { serializeCalendar } from "@/lib/ical/serializer";
import { loadOverridesForEvents } from "@/lib/events/overrides";
import { loadVenueCanonicalMap } from "@/lib/venues/canonical";
import { siteConfig } from "@/lib/site";

async function buildVenueSlugById(masters: EventMaster[]) {
  const venueIds = [
    ...new Set(
      masters.flatMap((master) => (master.venue ? [master.venue.id] : [])),
    ),
  ];

  if (venueIds.length === 0) {
    return {};
  }

  const [canonicalMap, venues] = await Promise.all([
    loadVenueCanonicalMap(),
    db.query.venues.findMany({
      columns: { id: true, slug: true },
    }),
  ]);

  const venueById = new Map(venues.map((venue) => [venue.id, venue]));
  const venueSlugById: Record<string, string> = {};

  for (const venueId of venueIds) {
    const canonicalId = canonicalMap.resolve(venueId);
    const canonicalVenue = venueById.get(canonicalId);

    if (canonicalVenue) {
      venueSlugById[venueId] = canonicalVenue.slug;
    }
  }

  return venueSlugById;
}

async function resolveEventsBySlugs(slugs: string[]) {
  const from = getDefaultFromDate();
  const events: EventMaster[] = [];

  for (const slug of slugs) {
    const resolution = await resolveEventBySlug(slug);

    if (
      resolution?.kind === "event" &&
      isMasterRelevantForExport(resolution.event, from)
    ) {
      events.push(resolution.event);
    }
  }

  return events;
}

export async function getFilteredEventsForExport(filters: IcalPayload) {
  let events: EventMaster[];

  if (filters.event.length > 0) {
    events = await resolveEventsBySlugs(filters.event);
  } else {
    events = await getEventsForExport();
  }

  if (!hasActiveAgendaFilters(filters)) {
    return events;
  }

  const venueSlugById =
    filters.venue.length > 0 ? await buildVenueSlugById(events) : {};

  return filterMastersForExport(events, filters, venueSlugById);
}

async function buildFeedMeta(filters: IcalPayload, events: EventMaster[]) {
  if (filters.event.length === 1 && !hasActiveAgendaFilters(filters)) {
    const event = events[0];

    return {
      name: event?.title ?? siteConfig.name,
      description: event?.description ?? undefined,
      filename: `${filters.event[0]}.ics`,
    };
  }

  if (
    filters.org.length === 1 &&
    filters.category.length === 0 &&
    filters.venue.length === 0 &&
    filters.event.length === 0
  ) {
    const organizer =
      events[0]?.organization ??
      (await db.query.organizations.findFirst({
        where: eq(organizations.slug, filters.org[0]!),
      }));
    const organizerName = organizer?.name ?? filters.org[0];

    return {
      name: `${organizerName} | ${siteConfig.name}`,
      description: `Événements swing de ${organizerName} à Toulouse`,
      filename: `${filters.org[0]}.ics`,
    };
  }

  if (!hasActiveIcalPayload(filters)) {
    return {
      name: siteConfig.name,
      description: siteConfig.description,
      filename: "swing-toulouse.ics",
    };
  }

  const parts: string[] = [];

  if (filters.category.length > 0) {
    parts.push(filters.category.join(", "));
  }

  if (filters.venue.length > 0) {
    parts.push(`${filters.venue.length} lieu(x)`);
  }

  if (filters.org.length > 0) {
    parts.push(`${filters.org.length} organisateur(s)`);
  }

  if (filters.event.length > 0) {
    parts.push(`${filters.event.length} événement(s)`);
  }

  const summary = parts.join(" · ");

  return {
    name: `${siteConfig.name} - ${summary}`,
    description: `Agenda swing filtré (${summary})`,
    filename: "swing-toulouse-filtre.ics",
  };
}

export async function buildIcalFeedResponse(filters: IcalPayload) {
  const events = await getFilteredEventsForExport(filters);
  const overrides = await loadOverridesForEvents(
    events.map((event) => event.id),
  );
  const normalized = await buildNormalizedEventsForExport(events, overrides);
  const meta = await buildFeedMeta(filters, events);

  const calendar = serializeCalendar(normalized, {
    name: meta.name,
    description: meta.description,
    prodId: siteConfig.icalProdId,
  });

  return new NextResponse(calendar, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="${meta.filename}"`,
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
