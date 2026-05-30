import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import type { PlaceDetails } from "@/lib/google/places";

export type PlaceSuggestion = {
  placeId: string;
  label: string;
  mainText: string;
  secondaryText: string;
};

const PLACES_STALE_TIME = 10 * 60 * 1000;

async function fetchPlaceSuggestions(input: string): Promise<PlaceSuggestion[]> {
  const response = await fetch(
    `/api/admin/places/autocomplete?input=${encodeURIComponent(input.trim())}`,
  );
  const data = (await response.json()) as {
    error?: string;
    suggestions?: PlaceSuggestion[];
  };

  if (!response.ok) {
    throw new Error(data.error ?? "Recherche impossible.");
  }

  return data.suggestions ?? [];
}

async function fetchPlaceDetails(placeId: string): Promise<PlaceDetails> {
  const response = await fetch(
    `/api/admin/places/details?placeId=${encodeURIComponent(placeId)}`,
  );
  const data = (await response.json()) as {
    error?: string;
    place?: PlaceDetails;
  };

  if (!response.ok || !data.place) {
    throw new Error(data.error ?? "Détails du lieu indisponibles.");
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
    queryKey: ["admin", "places", "autocomplete", trimmed],
    queryFn: () => fetchPlaceSuggestions(trimmed),
    enabled: enabled && trimmed.length >= 3,
    staleTime: PLACES_STALE_TIME,
  });
}

export function usePlaceDetailsFetcher() {
  const queryClient = useQueryClient();

  return (placeId: string) =>
    queryClient.fetchQuery({
      queryKey: ["admin", "places", "details", placeId],
      queryFn: () => fetchPlaceDetails(placeId),
      staleTime: PLACES_STALE_TIME,
    });
}
