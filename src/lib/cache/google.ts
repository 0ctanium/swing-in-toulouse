import { cacheLife } from "next/cache";

/** ~30 days - Google Places / Static Maps are costly; traffic must not drive API usage. */
export const GOOGLE_MAPS_CACHE_SECONDS = 60 * 60 * 24 * 30;

/** ~90 days - hard expiration for cached Google payloads. */
export const GOOGLE_MAPS_CACHE_EXPIRE_SECONDS = 60 * 60 * 24 * 90;

/**
 * Browser / CDN cache for `/api/maps/*` image proxies.
 * `immutable` is safe: URLs are keyed by coordinates or stable photo resource names.
 */
export const GOOGLE_MAPS_HTTP_CACHE_CONTROL = [
  "public",
  `max-age=${GOOGLE_MAPS_CACHE_SECONDS}`,
  `s-maxage=${GOOGLE_MAPS_CACHE_SECONDS}`,
  `stale-while-revalidate=${GOOGLE_MAPS_CACHE_EXPIRE_SECONDS}`,
  "immutable",
].join(", ");

export function applyGoogleMapsCacheLife() {
  cacheLife({
    stale: GOOGLE_MAPS_CACHE_SECONDS,
    revalidate: GOOGLE_MAPS_CACHE_SECONDS,
    expire: GOOGLE_MAPS_CACHE_EXPIRE_SECONDS,
  });
}

export function googlePlaceCacheKey(placeId: string) {
  return placeId.replace(/^places\//, "");
}

export function googleStaticMapCacheKey(
  latitude: number,
  longitude: number,
  zoom: number,
) {
  return `${latitude.toFixed(4)},${longitude.toFixed(4)},z${zoom}`;
}
