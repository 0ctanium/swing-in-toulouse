import { revalidateTag } from "next/cache";

import {
  googlePlaceCacheKey,
  googleStaticMapCacheKey,
} from "@/lib/cache/google";
import { DEFAULT_STATIC_MAP_ZOOM } from "@/lib/google/static-map";
import { CACHE_TAGS } from "@/lib/cache/tags";

const REVALIDATE_PROFILE = "max";

export function invalidateGooglePlaceCache(placeId: string) {
  const key = googlePlaceCacheKey(placeId);
  revalidateTag(CACHE_TAGS.googlePlaces, REVALIDATE_PROFILE);
  revalidateTag(`${CACHE_TAGS.googlePlaces}-${key}`, REVALIDATE_PROFILE);
  revalidateTag(`${CACHE_TAGS.googlePlaces}-coords-${key}`, REVALIDATE_PROFILE);
}

export function invalidateGooglePlaceCacheForVenue(venue: {
  googlePlaceId: string | null;
}) {
  if (venue.googlePlaceId) {
    invalidateGooglePlaceCache(venue.googlePlaceId);
  }
}

export function invalidateGoogleStaticMapCache(venue: {
  latitude: number | null;
  longitude: number | null;
}) {
  if (venue.latitude == null || venue.longitude == null) {
    return;
  }

  revalidateTag(CACHE_TAGS.googleMapsMedia, REVALIDATE_PROFILE);
  revalidateTag(
    `${CACHE_TAGS.googleMapsMedia}-static-${googleStaticMapCacheKey(venue.latitude, venue.longitude, DEFAULT_STATIC_MAP_ZOOM)}`,
    REVALIDATE_PROFILE,
  );
}

export function invalidateGoogleCachesForVenue(venue: {
  googlePlaceId: string | null;
  latitude: number | null;
  longitude: number | null;
}) {
  invalidateGooglePlaceCacheForVenue(venue);
  invalidateGoogleStaticMapCache(venue);
}

export function invalidatePublicEventCache() {
  revalidateTag(CACHE_TAGS.events, REVALIDATE_PROFILE);
  revalidateTag(CACHE_TAGS.agendaFilters, REVALIDATE_PROFILE);
}

export function invalidatePublicOrganizerCache() {
  revalidateTag(CACHE_TAGS.organizers, REVALIDATE_PROFILE);
  invalidatePublicEventCache();
}

export function invalidatePublicVenueCache(venue?: {
  googlePlaceId: string | null;
  latitude: number | null;
  longitude: number | null;
}) {
  revalidateTag(CACHE_TAGS.venues, REVALIDATE_PROFILE);
  invalidatePublicEventCache();
  if (venue) {
    invalidateGoogleCachesForVenue(venue);
  }
}

export function invalidateCategoryTagMetadataCache() {
  revalidateTag(CACHE_TAGS.categoryTags, REVALIDATE_PROFILE);
  revalidateTag(CACHE_TAGS.agendaFilters, REVALIDATE_PROFILE);
}

export function invalidateAllPublicCache() {
  revalidateTag(CACHE_TAGS.events, REVALIDATE_PROFILE);
  revalidateTag(CACHE_TAGS.organizers, REVALIDATE_PROFILE);
  revalidateTag(CACHE_TAGS.venues, REVALIDATE_PROFILE);
  revalidateTag(CACHE_TAGS.agendaFilters, REVALIDATE_PROFILE);
  revalidateTag(CACHE_TAGS.categoryTags, REVALIDATE_PROFILE);
}
