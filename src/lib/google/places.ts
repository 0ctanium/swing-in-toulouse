import { env, isGoogleMapsConfigured } from "@/env";

const TOULOUSE_CENTER = { latitude: 43.604652, longitude: 1.444209 };
const AUTocomplete_RADIUS_METERS = 50_000;

/** Up to 5 types (Places API limit). Includes `route` for whole-street venues. */
const AUTocomplete_PRIMARY_TYPES = [
  "establishment",
  "point_of_interest",
  "premise",
  "street_address",
  "route",
] as const;

export class GooglePlacesError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GooglePlacesError";
  }
}

export type PlaceSuggestion = {
  placeId: string;
  label: string;
  mainText: string;
  secondaryText: string;
};

export type PlaceDetails = {
  placeId: string;
  name: string;
  formattedAddress: string;
  address: string | null;
  city: string;
  latitude: number;
  longitude: number;
};

function assertGoogleConfigured() {
  if (!isGoogleMapsConfigured()) {
    throw new GooglePlacesError(
      "Google Maps API non configurée (GOOGLE_MAPS_API_KEY manquante).",
    );
  }
}

export async function autocompletePlaces(input: string) {
  assertGoogleConfigured();

  const trimmed = input.trim();
  if (trimmed.length < 3) {
    return [];
  }

  const suggestions = await fetchPlacesAutocomplete(trimmed);
  if (suggestions.length > 0) {
    return suggestions;
  }

  return geocodeAutocompleteFallback(trimmed);
}

async function fetchPlacesAutocomplete(input: string) {
  const response = await fetch(
    "https://places.googleapis.com/v1/places:autocomplete",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": env.GOOGLE_MAPS_API_KEY!,
        "X-Goog-FieldMask":
          "suggestions.placePrediction.placeId,suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat",
      },
      body: JSON.stringify({
        input,
        includedRegionCodes: ["fr"],
        includedPrimaryTypes: [...AUTocomplete_PRIMARY_TYPES],
        locationBias: {
          circle: {
            center: TOULOUSE_CENTER,
            radius: AUTocomplete_RADIUS_METERS,
          },
        },
      }),
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new GooglePlacesError(
      `Autocomplete Google échoué (${response.status}) : ${body}`,
    );
  }

  const data = (await response.json()) as {
    suggestions?: Array<{
      placePrediction?: {
        placeId?: string;
        text?: { text?: string };
        structuredFormat?: {
          mainText?: { text?: string };
          secondaryText?: { text?: string };
        };
      };
    }>;
  };

  return (data.suggestions ?? [])
    .map((item) => item.placePrediction)
    .filter((prediction) => prediction?.placeId && prediction.text?.text)
    .map((prediction) => ({
      placeId: prediction!.placeId!,
      label: prediction!.text!.text!,
      mainText: prediction!.structuredFormat?.mainText?.text ?? prediction!.text!.text!,
      secondaryText: prediction!.structuredFormat?.secondaryText?.text ?? "",
    })) satisfies PlaceSuggestion[];
}

const GEOCODE_AUTocomplete_TYPES = new Set([
  "route",
  "street_address",
  "premise",
  "establishment",
  "point_of_interest",
  "intersection",
]);

async function geocodeAutocompleteFallback(input: string) {
  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?${new URLSearchParams({
      address: input,
      key: env.GOOGLE_MAPS_API_KEY!,
      region: "fr",
      components: "country:FR",
    })}`,
  );

  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as {
    status?: string;
    results?: Array<{
      place_id?: string;
      formatted_address?: string;
      types?: string[];
      address_components?: Array<{ long_name?: string; types?: string[] }>;
    }>;
  };

  if (data.status !== "OK" || !data.results?.length) {
    return [];
  }

  return data.results
    .filter(
      (result) =>
        result.place_id &&
        result.formatted_address &&
        (result.types ?? []).some((type) => GEOCODE_AUTocomplete_TYPES.has(type)),
    )
    .slice(0, 8)
    .map((result) => {
      const route = result.address_components?.find((component) =>
        component.types?.includes("route"),
      )?.long_name;
      const parts = result.formatted_address!.split(",").map((part) => part.trim());
      const mainText = route ?? parts[0] ?? result.formatted_address!;
      const secondaryText =
        parts.length > 1 ? parts.slice(1).join(", ") : "";

      return {
        placeId: result.place_id!,
        label: result.formatted_address!,
        mainText,
        secondaryText,
      } satisfies PlaceSuggestion;
    });
}

function cityFromAddressComponents(
  components: Array<{ longText?: string; types?: string[] }>,
) {
  const priority = ["locality", "postal_town", "administrative_area_level_2"];

  for (const type of priority) {
    const match = components.find((component) => component.types?.includes(type));
    if (match?.longText) {
      return match.longText;
    }
  }

  return "Toulouse";
}

function routeFromAddressComponents(
  components: Array<{ longText?: string; types?: string[] }>,
) {
  return components.find((component) => component.types?.includes("route"))
    ?.longText;
}

function streetAddressFromComponents(
  components: Array<{ longText?: string; types?: string[] }>,
) {
  const streetNumber = components.find((c) =>
    c.types?.includes("street_number"),
  )?.longText;
  const route = routeFromAddressComponents(components);

  if (streetNumber && route) {
    return `${streetNumber} ${route}`;
  }

  return route ?? null;
}

export async function getPlaceDetails(placeId: string): Promise<PlaceDetails> {
  assertGoogleConfigured();

  const resourceName = placeId.startsWith("places/") ? placeId : `places/${placeId}`;
  const response = await fetch(
    `https://places.googleapis.com/v1/${resourceName}`,
    {
      headers: {
        "X-Goog-Api-Key": env.GOOGLE_MAPS_API_KEY!,
        "X-Goog-FieldMask":
          "id,displayName,formattedAddress,location,addressComponents,shortFormattedAddress",
      },
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new GooglePlacesError(
      `Détails Google échoués (${response.status}) : ${body}`,
    );
  }

  const data = (await response.json()) as {
    id?: string;
    displayName?: { text?: string };
    formattedAddress?: string;
    shortFormattedAddress?: string;
    location?: { latitude?: number; longitude?: number };
    addressComponents?: Array<{ longText?: string; types?: string[] }>;
  };

  const latitude = data.location?.latitude;
  const longitude = data.location?.longitude;

  if (latitude == null || longitude == null) {
    throw new GooglePlacesError("Coordonnées GPS indisponibles pour ce lieu.");
  }

  const components = data.addressComponents ?? [];
  const city = cityFromAddressComponents(components);
  const route = routeFromAddressComponents(components);
  const street = streetAddressFromComponents(components);

  return {
    placeId: data.id ?? placeId,
    name:
      data.displayName?.text ??
      route ??
      data.formattedAddress?.split(",")[0]?.trim() ??
      "Lieu",
    formattedAddress:
      data.formattedAddress ?? data.shortFormattedAddress ?? street ?? "",
    address: street ?? route ?? data.shortFormattedAddress ?? null,
    city,
    latitude,
    longitude,
  };
}

export async function geocodeAddress(query: string): Promise<PlaceDetails> {
  assertGoogleConfigured();

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?${new URLSearchParams({
      address: query,
      key: env.GOOGLE_MAPS_API_KEY!,
      region: "fr",
      components: "country:FR",
    })}`,
  );

  if (!response.ok) {
    throw new GooglePlacesError(`Géocodage échoué (${response.status}).`);
  }

  const data = (await response.json()) as {
    status?: string;
    results?: Array<{
      place_id?: string;
      formatted_address?: string;
      types?: string[];
      geometry?: { location?: { lat?: number; lng?: number } };
      address_components?: Array<{ long_name?: string; types?: string[] }>;
    }>;
  };

  if (data.status !== "OK" || !data.results?.[0]) {
    throw new GooglePlacesError("Adresse introuvable via Google.");
  }

  const result = data.results[0];
  const components =
    result.address_components?.map((component) => ({
      longText: component.long_name,
      types: component.types,
    })) ?? [];
  const route = routeFromAddressComponents(components);

  const latitude = result.geometry?.location?.lat;
  const longitude = result.geometry?.location?.lng;

  if (latitude == null || longitude == null) {
    throw new GooglePlacesError("Coordonnées GPS indisponibles pour cette adresse.");
  }

  const isRouteOnly = (result.types ?? []).includes("route");

  return {
    placeId: result.place_id ?? query,
    name:
      route ??
      result.formatted_address?.split(",")[0]?.trim() ??
      query,
    formattedAddress: result.formatted_address ?? query,
    address:
      streetAddressFromComponents(components) ??
      (isRouteOnly ? (route ?? null) : null),
    city: cityFromAddressComponents(components),
    latitude,
    longitude,
  };
}
