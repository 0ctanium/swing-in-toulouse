import { cache } from "react";
import { cacheTag } from "next/cache";

import {
  applyGoogleMapsCacheLife,
  googlePlaceCacheKey,
} from "@/lib/cache/google";
import { CACHE_TAGS } from "@/lib/cache/tags";
import { getPlaceDetails } from "@/lib/google/places";
import { fetchPlaceDisplayDataUncached } from "@/lib/google/place-display";

async function getPlaceDisplayDataCached(placeId: string) {
  "use cache";
  applyGoogleMapsCacheLife();
  cacheTag(
    CACHE_TAGS.googlePlaces,
    `${CACHE_TAGS.googlePlaces}-${googlePlaceCacheKey(placeId)}`,
  );

  return fetchPlaceDisplayDataUncached(placeId);
}

export const getPlaceDisplayData = cache(getPlaceDisplayDataCached);

async function getPlaceCoordinatesCached(placeId: string) {
  "use cache";
  applyGoogleMapsCacheLife();
  cacheTag(
    CACHE_TAGS.googlePlaces,
    `${CACHE_TAGS.googlePlaces}-coords-${googlePlaceCacheKey(placeId)}`,
  );

  try {
    const details = await getPlaceDetails(placeId);
    return {
      latitude: details.latitude,
      longitude: details.longitude,
    };
  } catch {
    return null;
  }
}

export const getPlaceCoordinates = cache(getPlaceCoordinatesCached);
