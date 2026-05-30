import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { fetchJson } from "@/lib/api/fetch-json";
import { placesQueryKeys } from "@/lib/admin/query-keys";
import type { PlaceDetails } from "@/lib/google/places";

export type PlaceSuggestion = {
  placeId: string;
  label: string;
  mainText: string;
  secondaryText: string;
};

const PLACES_STALE_TIME = 10 * 60 * 1000;

async function fetchPlaceSuggestions(input: string): Promise<PlaceSuggestion[]> {
  const data = await fetchJson<{
    suggestions?: PlaceSuggestion[];
  }>(
    `/api/admin/places/autocomplete?input=${encodeURIComponent(input.trim())}`,
    undefined,
    "Recherche impossible.",
  );

  return data.suggestions ?? [];
}

async function fetchPlaceDetails(placeId: string): Promise<PlaceDetails> {
  const data = await fetchJson<{
    place?: PlaceDetails;
  }>(
    `/api/admin/places/details?placeId=${encodeURIComponent(placeId)}`,
    undefined,
    "Détails du lieu indisponibles.",
  );

  if (!data.place) {
    throw new Error("Détails du lieu indisponibles.");
  }

  return data.place;
}

export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedValue(value), delayMs);
    return () => window.clearTimeout(timeout);
  }, [value, delayMs]);

  return debouncedValue;
}

export function usePlacesAutocomplete(input: string, enabled: boolean) {
  const trimmed = input.trim();

  return useQuery({
    queryKey: placesQueryKeys.autocomplete(trimmed),
    queryFn: () => fetchPlaceSuggestions(trimmed),
    enabled: enabled && trimmed.length >= 3,
    staleTime: PLACES_STALE_TIME,
  });
}

export function usePlaceDetailsFetcher() {
  const queryClient = useQueryClient();

  return (placeId: string) =>
    queryClient.fetchQuery({
      queryKey: placesQueryKeys.details(placeId),
      queryFn: () => fetchPlaceDetails(placeId),
      staleTime: PLACES_STALE_TIME,
    });
}
