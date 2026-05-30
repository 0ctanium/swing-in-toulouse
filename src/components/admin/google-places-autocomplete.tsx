"use client";

import { useId, useRef, useState } from "react";

import type { PlaceDetails } from "@/lib/google/places";
import {
  type PlaceSuggestion,
  useDebouncedValue,
  usePlaceDetailsFetcher,
  usePlacesAutocomplete,
} from "@/lib/google/use-places";

type GooglePlacesAutocompleteProps = {
  id?: string;
  defaultQuery?: string;
  placeholder?: string;
  disabled?: boolean;
  onSelect: (place: PlaceDetails) => void;
};

export function GooglePlacesAutocomplete({
  id,
  defaultQuery = "",
  placeholder = "Rechercher une adresse sur Google…",
  disabled = false,
  onSelect,
}: GooglePlacesAutocompleteProps) {
  const listId = useId();
  const [query, setQuery] = useState(defaultQuery);
  const [isEditing, setIsEditing] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectError, setSelectError] = useState<string | null>(null);
  const [selecting, setSelecting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebouncedValue(query, 280);
  const fetchPlaceDetails = usePlaceDetailsFetcher();

  const {
    data: suggestions = [],
    isFetching,
    error,
  } = usePlacesAutocomplete(debouncedQuery, isEditing);

  const showDropdown =
    open && isEditing && suggestions.length > 0 && !selecting;

  async function selectSuggestion(suggestion: PlaceSuggestion) {
    setSelecting(true);
    setSelectError(null);
    setOpen(false);
    setQuery(suggestion.label);

    try {
      const place = await fetchPlaceDetails(suggestion.placeId);
      onSelect(place);
    } catch (fetchError) {
      setSelectError(
        fetchError instanceof Error
          ? fetchError.message
          : "Détails du lieu indisponibles.",
      );
    } finally {
      setSelecting(false);
    }
  }

  return (
    <div ref={containerRef} className="relative flex flex-col gap-1">
      <input
        id={id}
        className="rounded-lg border bg-background px-3 py-2 text-sm"
        autoComplete="off"
        data-lpignore="true"
        data-form-type="other"
        value={query}
        disabled={disabled || selecting}
        placeholder={placeholder}
        aria-controls={listId}
        aria-expanded={showDropdown}
        aria-autocomplete="list"
        onChange={(event) => {
          setIsEditing(true);
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => {
          setIsEditing(true);
          if (query.trim().length >= 3) {
            setOpen(true);
          }
        }}
        onBlur={(event) => {
          if (!containerRef.current?.contains(event.relatedTarget as Node)) {
            setOpen(false);
          }
        }}
      />
      {isFetching || selecting ? (
        <span className="text-muted-foreground text-xs">Recherche…</span>
      ) : null}
      {error ? (
        <span className="text-destructive text-xs">{error.message}</span>
      ) : null}
      {selectError ? (
        <span className="text-destructive text-xs">{selectError}</span>
      ) : null}
      {showDropdown ? (
        <ul
          id={listId}
          className="absolute top-full z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border bg-popover shadow-md"
        >
          {suggestions.map((suggestion) => (
            <li key={suggestion.placeId}>
              <button
                type="button"
                className="flex w-full flex-col gap-0.5 px-3 py-2 text-left text-sm hover:bg-muted"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectSuggestion(suggestion)}
              >
                <span className="font-medium">{suggestion.mainText}</span>
                {suggestion.secondaryText ? (
                  <span className="text-muted-foreground text-xs">
                    {suggestion.secondaryText}
                  </span>
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
