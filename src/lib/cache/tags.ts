export const CACHE_TAGS = {
  events: "events",
  organizers: "organizers",
  venues: "venues",
  agendaFilters: "agenda-filters",
  categoryTags: "category-tags",
  /** Google Places display payloads (photos, hours, rating). */
  googlePlaces: "google-places",
  /** Google Static Maps + Places photo media bytes. */
  googleMapsMedia: "google-maps-media",
} as const;

export function eventSlugCacheTag(slug: string) {
  return `event-slug-${slug}`;
}

export function relatedEventsCacheTag(slug: string) {
  return `related-events-${slug}`;
}
