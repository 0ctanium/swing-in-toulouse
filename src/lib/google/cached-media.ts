import { cache } from "react";
import { cacheTag } from "next/cache";

import { env, isGoogleMapsConfigured } from "@/env";
import {
  applyGoogleMapsCacheLife,
  googleStaticMapCacheKey,
} from "@/lib/cache/google";
import { CACHE_TAGS } from "@/lib/cache/tags";
import {
  buildStaticMapUrl,
  DEFAULT_STATIC_MAP_ZOOM,
} from "@/lib/google/static-map";

const PHOTO_NAME_PATTERN = /^places\/[^/]+\/photos\/[^/]+$/;

export type CachedImagePayload = {
  bytes: ArrayBuffer;
  contentType: string;
};

async function getStaticMapImageCached(
  latitude: number,
  longitude: number,
): Promise<CachedImagePayload | null> {
  "use cache";
  applyGoogleMapsCacheLife();
  cacheTag(
    CACHE_TAGS.googleMapsMedia,
    `${CACHE_TAGS.googleMapsMedia}-static-${googleStaticMapCacheKey(latitude, longitude, DEFAULT_STATIC_MAP_ZOOM)}`,
  );

  if (!isGoogleMapsConfigured()) {
    return null;
  }

  const mapUrl = buildStaticMapUrl({
    latitude,
    longitude,
    zoom: DEFAULT_STATIC_MAP_ZOOM,
  });
  if (!mapUrl) {
    return null;
  }

  const response = await fetch(mapUrl, { cache: "no-store" });
  if (!response.ok) {
    return null;
  }

  return {
    bytes: await response.arrayBuffer(),
    contentType: response.headers.get("content-type") ?? "image/png",
  };
}

export const getStaticMapImage = cache(getStaticMapImageCached);

async function getPlacePhotoImageCached(
  photoName: string,
): Promise<CachedImagePayload | null> {
  "use cache";
  applyGoogleMapsCacheLife();
  cacheTag(
    CACHE_TAGS.googleMapsMedia,
    `${CACHE_TAGS.googleMapsMedia}-photo-${photoName}`,
  );

  if (!isGoogleMapsConfigured() || !PHOTO_NAME_PATTERN.test(photoName)) {
    return null;
  }

  const mediaUrl = new URL(`https://places.googleapis.com/v1/${photoName}/media`);
  mediaUrl.searchParams.set("maxHeightPx", "480");
  mediaUrl.searchParams.set("maxWidthPx", "720");
  mediaUrl.searchParams.set("key", env.GOOGLE_MAPS_API_KEY!);

  const response = await fetch(mediaUrl, {
    redirect: "follow",
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  return {
    bytes: await response.arrayBuffer(),
    contentType: response.headers.get("content-type") ?? "image/jpeg",
  };
}

export const getPlacePhotoImage = cache(getPlacePhotoImageCached);
