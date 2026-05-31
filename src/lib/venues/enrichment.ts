import { cache } from "react";
import { cacheTag } from "next/cache";

import type { Venue } from "@/db/schema";
import { isGoogleMapsConfigured } from "@/env";
import {
  applyGoogleMapsCacheLife,
  googlePlaceCacheKey,
} from "@/lib/cache/google";
import { CACHE_TAGS } from "@/lib/cache/tags";
import {
  getPlaceCoordinates,
  getPlaceDisplayData,
} from "@/lib/google/cached-place";
import type { PlaceDisplayData } from "@/lib/google/place-display";
import { buildStaticMapProxyUrl } from "@/lib/google/static-map";

import { getVenueDisplayAddress, getVenueMapsUrl } from "./display";

export type VenueDetailsFields = Pick<
  Venue,
  | "id"
  | "slug"
  | "name"
  | "address"
  | "city"
  | "category"
  | "formattedAddress"
  | "googlePlaceId"
  | "latitude"
  | "longitude"
  | "addressConfirmedAt"
>;

export type VenueEnrichment = {
  displayAddress: string | null;
  mapsUrl: string | null;
  mapImageSrc: string | null;
  place: PlaceDisplayData | null;
};

function resolveStoredCoordinates(venue: VenueDetailsFields) {
  if (venue.latitude != null && venue.longitude != null) {
    return { latitude: venue.latitude, longitude: venue.longitude };
  }

  return null;
}

async function resolveCoordinates(venue: VenueDetailsFields) {
  const stored = resolveStoredCoordinates(venue);
  if (stored) {
    return stored;
  }

  if (!isGoogleMapsConfigured() || !venue.googlePlaceId) {
    return null;
  }

  return getPlaceCoordinates(venue.googlePlaceId);
}

async function loadVenueEnrichmentUncached(
  venue: VenueDetailsFields,
): Promise<VenueEnrichment> {
  const displayAddress = getVenueDisplayAddress(venue);
  const mapsUrl = getVenueMapsUrl(venue);

  const [coordinates, place] = await Promise.all([
    resolveCoordinates(venue),
    isGoogleMapsConfigured() && venue.googlePlaceId
      ? getPlaceDisplayData(venue.googlePlaceId)
      : Promise.resolve(null),
  ]);

  const mapImageSrc = coordinates
    ? buildStaticMapProxyUrl(coordinates.latitude, coordinates.longitude)
    : null;

  return {
    displayAddress,
    mapsUrl: mapsUrl ?? place?.googleMapsUri ?? null,
    mapImageSrc: isGoogleMapsConfigured() ? mapImageSrc : null,
    place,
  };
}

async function loadVenueEnrichmentCached(venue: VenueDetailsFields) {
  "use cache";
  applyGoogleMapsCacheLife();
  cacheTag(CACHE_TAGS.venues, `venue-enrichment-${venue.id}`);
  if (venue.googlePlaceId) {
    cacheTag(
      CACHE_TAGS.googlePlaces,
      `${CACHE_TAGS.googlePlaces}-${googlePlaceCacheKey(venue.googlePlaceId)}`,
    );
  }

  return loadVenueEnrichmentUncached(venue);
}

export const getVenueEnrichment = cache(loadVenueEnrichmentCached);

export function venueDetailsSectionVisible(enrichment: VenueEnrichment) {
  return Boolean(
    enrichment.displayAddress ||
      enrichment.mapImageSrc ||
      enrichment.mapsUrl ||
      enrichment.place?.photos.length ||
      enrichment.place?.websiteUri ||
      enrichment.place?.openingHours?.length ||
      enrichment.place?.rating != null,
  );
}
