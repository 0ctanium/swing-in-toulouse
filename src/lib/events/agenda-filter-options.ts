import { db } from "@/db";
import { getUpcomingEvents } from "@/lib/events/queries";
import { getDefaultExpansionWindow } from "@/lib/ical/recurrence";
import { loadVenueCanonicalMap } from "@/lib/venues/canonical";

export type AgendaFilterOption = {
  value: string;
  label: string;
};

export type AgendaFilterOptions = {
  categories: AgendaFilterOption[];
  venues: AgendaFilterOption[];
  organizations: AgendaFilterOption[];
  venueSlugById: Record<string, string>;
};

function sortOptions(options: AgendaFilterOption[]) {
  return options.sort((left, right) =>
    left.label.localeCompare(right.label, "fr"),
  );
}

export async function getAgendaFilterOptions(): Promise<AgendaFilterOptions> {
  const window = getDefaultExpansionWindow();
  const occurrences = await getUpcomingEvents({
    from: window.from,
    to: window.to,
  });

  const [canonicalMap, allVenues] = await Promise.all([
    loadVenueCanonicalMap(),
    db.query.venues.findMany({
      columns: { id: true, slug: true, name: true },
    }),
  ]);

  const venueById = new Map(allVenues.map((venue) => [venue.id, venue]));
  const categories = new Set<string>();
  const venues = new Map<string, AgendaFilterOption>();
  const organizations = new Map<string, AgendaFilterOption>();
  const venueSlugById: Record<string, string> = {};

  for (const occurrence of occurrences) {
    occurrence.categories?.forEach((category) => {
      const trimmed = category.trim();
      if (trimmed) {
        categories.add(trimmed);
      }
    });

    if (occurrence.venue) {
      const canonicalId = canonicalMap.resolve(occurrence.venue.id);
      const canonicalVenue = venueById.get(canonicalId);

      if (canonicalVenue) {
        venues.set(canonicalId, {
          value: canonicalVenue.slug,
          label: canonicalVenue.name,
        });
        venueSlugById[occurrence.venue.id] = canonicalVenue.slug;
      }
    }

    if (occurrence.organization) {
      organizations.set(occurrence.organization.id, {
        value: occurrence.organization.slug,
        label: occurrence.organization.name,
      });
    }
  }

  return {
    categories: sortOptions(
      [...categories].map((category) => ({
        value: category,
        label: category,
      })),
    ),
    venues: sortOptions([...venues.values()]),
    organizations: sortOptions([...organizations.values()]),
    venueSlugById,
  };
}
