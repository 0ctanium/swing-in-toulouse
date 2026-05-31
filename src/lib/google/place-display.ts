import { env, isGoogleMapsConfigured } from "@/env";

import { GooglePlacesError } from "./places";

const MAX_PHOTOS = 4;
const PHOTO_MAX_HEIGHT = 480;
const PHOTO_MAX_WIDTH = 720;

export type PlacePhotoAttribution = {
  displayName: string | null;
  uri: string | null;
};

export type PlaceDisplayPhoto = {
  name: string;
  widthPx: number;
  heightPx: number;
  proxySrc: string;
  attributions: PlacePhotoAttribution[];
};

export type PlaceDisplayData = {
  googleMapsUri: string | null;
  websiteUri: string | null;
  rating: number | null;
  userRatingCount: number | null;
  openingHours: string[] | null;
  photos: PlaceDisplayPhoto[];
};

function assertGoogleConfigured() {
  if (!isGoogleMapsConfigured()) {
    throw new GooglePlacesError(
      "Google Maps API non configurée (GOOGLE_MAPS_API_KEY manquante).",
    );
  }
}

function placePhotoProxySrc(photoName: string) {
  return `/api/maps/photo?${new URLSearchParams({ name: photoName }).toString()}`;
}

function mapAttributions(
  attributions?: Array<{
    displayName?: string;
    uri?: string;
  }>,
): PlacePhotoAttribution[] {
  return (attributions ?? []).map((item) => ({
    displayName: item.displayName?.trim() ?? null,
    uri: item.uri?.trim() ?? null,
  }));
}

/** Uncached Places API fetch — use {@link getPlaceDisplayData} in application code. */
export async function fetchPlaceDisplayDataUncached(
  placeId: string,
): Promise<PlaceDisplayData | null> {
  if (!isGoogleMapsConfigured()) {
    return null;
  }

  assertGoogleConfigured();

  const resourceName = placeId.startsWith("places/") ? placeId : `places/${placeId}`;
  const response = await fetch(
    `https://places.googleapis.com/v1/${resourceName}?languageCode=fr`,
    {
      headers: {
        "X-Goog-Api-Key": env.GOOGLE_MAPS_API_KEY!,
        "X-Goog-FieldMask":
          "googleMapsUri,websiteUri,rating,userRatingCount,regularOpeningHours,photos",
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as {
    googleMapsUri?: string;
    websiteUri?: string;
    rating?: number;
    userRatingCount?: number;
    regularOpeningHours?: { weekdayDescriptions?: string[] };
    photos?: Array<{
      name?: string;
      widthPx?: number;
      heightPx?: number;
      authorAttributions?: Array<{
        displayName?: string;
        uri?: string;
      }>;
    }>;
  };

  const photos = (data.photos ?? [])
    .filter((photo) => photo.name)
    .slice(0, MAX_PHOTOS)
    .map((photo) => ({
      name: photo.name!,
      widthPx: photo.widthPx ?? PHOTO_MAX_WIDTH,
      heightPx: photo.heightPx ?? PHOTO_MAX_HEIGHT,
      proxySrc: placePhotoProxySrc(photo.name!),
      attributions: mapAttributions(photo.authorAttributions),
    }));

  return {
    googleMapsUri: data.googleMapsUri?.trim() ?? null,
    websiteUri: data.websiteUri?.trim() ?? null,
    rating: data.rating ?? null,
    userRatingCount: data.userRatingCount ?? null,
    openingHours: data.regularOpeningHours?.weekdayDescriptions ?? null,
    photos,
  };
}
