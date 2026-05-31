import { env, isGoogleMapsConfigured } from "@/env";

/** Street-level (15) feels too tight; 14 shows more neighborhood context. */
export const DEFAULT_STATIC_MAP_ZOOM = 14;

export type StaticMapParams = {
  latitude: number;
  longitude: number;
  width?: number;
  height?: number;
  zoom?: number;
};

export function buildStaticMapUrl({
  latitude,
  longitude,
  width = 640,
  height = 320,
  zoom = DEFAULT_STATIC_MAP_ZOOM,
}: StaticMapParams) {
  if (!isGoogleMapsConfigured()) {
    return null;
  }

  const params = new URLSearchParams({
    center: `${latitude},${longitude}`,
    zoom: String(zoom),
    size: `${width}x${height}`,
    scale: "2",
    maptype: "roadmap",
    markers: `color:0xC2410C|${latitude},${longitude}`,
    key: env.GOOGLE_MAPS_API_KEY!,
  });

  return `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`;
}

export function buildStaticMapProxyUrl(latitude: number, longitude: number) {
  const params = new URLSearchParams({
    lat: String(latitude),
    lng: String(longitude),
  });

  return `/api/maps/static?${params.toString()}`;
}
