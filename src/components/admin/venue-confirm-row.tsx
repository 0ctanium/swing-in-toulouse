"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { GooglePlacesAutocomplete } from "@/components/admin/google-places-autocomplete";
import { VenueCategorySelect } from "@/components/admin/venue-category-select";
import { VenueIcalQualityBadge } from "@/components/admin/venue-ical-quality-badge";
import { Button } from "@/components/ui/button";
import { useConfirmVenue } from "@/lib/admin/use-venues";
import type { VenueCategory } from "@/db/schema";
import type { PlaceDetails } from "@/lib/google/places";
import type { AdminVenueRow } from "@/lib/venues/admin-venue-row";
import { isVenueAddressConfirmed } from "@/lib/venues/confirmation";

function initialSearchQuery(venue: AdminVenueRow) {
  if (venue.formattedAddress) {
    return venue.formattedAddress;
  }

  if (venue.address) {
    return `${venue.name}, ${venue.address}, ${venue.city}`;
  }

  return `${venue.name}, ${venue.city}`;
}

function venueToPlaceDetails(venue: AdminVenueRow): PlaceDetails | null {
  if (
    venue.googlePlaceId == null ||
    venue.latitude == null ||
    venue.longitude == null
  ) {
    return null;
  }

  return {
    placeId: venue.googlePlaceId,
    name: venue.name,
    formattedAddress:
      venue.formattedAddress ?? venue.address ?? `${venue.name}, ${venue.city}`,
    address: venue.address,
    city: venue.city,
    latitude: venue.latitude,
    longitude: venue.longitude,
  };
}

export type VenueConfirmRowProps = {
  venue: AdminVenueRow;
  mode?: "create" | "edit";
  onCancel?: () => void;
  onSaved?: () => void;
};

export function VenueConfirmRow({
  venue,
  mode = "create",
  onCancel,
  onSaved,
}: VenueConfirmRowProps) {
  const confirmVenue = useConfirmVenue();
  const addressPlaceholder = useMemo(() => initialSearchQuery(venue), [venue]);
  const initialPlace = useMemo(
    () => (mode === "edit" ? venueToPlaceDetails(venue) : null),
    [mode, venue],
  );
  const [venueName, setVenueName] = useState(venue.name);
  const [category, setCategory] = useState<VenueCategory | null>(
    venue.category,
  );
  const [originalPlace] = useState<PlaceDetails | null>(initialPlace);
  const [selectedPlace, setSelectedPlace] = useState<PlaceDetails | null>(
    initialPlace,
  );
  const pending = confirmVenue.isPending;
  const hasNewAddressSelection =
    mode === "edit" &&
    originalPlace != null &&
    selectedPlace != null &&
    selectedPlace.placeId !== originalPlace.placeId;

  const googleName = selectedPlace?.name.trim() ?? "";
  const showGoogleNameHint =
    googleName.length > 0 && googleName !== venueName.trim();

  async function confirm() {
    const trimmedName = venueName.trim();

    if (!trimmedName) {
      toast.error("Le nom du lieu est requis.");
      return;
    }

    if (!selectedPlace) {
      toast.error("Sélectionnez une adresse Google avant de confirmer.");
      return;
    }

    try {
      await confirmVenue.mutateAsync({
        venueId: venue.id,
        placeId: selectedPlace.placeId,
        name: trimmedName,
        category,
      });

      toast.success(
        mode === "edit"
          ? `${trimmedName} mis à jour.`
          : `${trimmedName} confirmé.`,
      );
      onSaved?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Confirmation impossible.",
      );
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <VenueIcalQualityBadge issues={venue.iCalIssues} />

      {mode === "create" ? (
        <div className="flex flex-wrap items-start justify-between gap-2">
          <p className="text-muted-foreground text-xs">
            {venue.eventCount} événement{venue.eventCount > 1 ? "s" : ""} ·{" "}
            {venue.address ?? "adresse iCal incomplète"}
          </p>
          <Link
            href={`/lieu/${venue.slug}`}
            target="_blank"
            rel="noreferrer"
            className="text-muted-foreground text-xs hover:underline"
          >
            /lieu/{venue.slug}
          </Link>
        </div>
      ) : (
        <p className="text-muted-foreground text-xs">
          Modifiez le nom ou l&apos;adresse Google, puis enregistrez.
        </p>
      )}

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={`venue-name-${venue.id}`}
          className="text-sm font-medium"
        >
          Nom du lieu
        </label>
        <input
          id={`venue-name-${venue.id}`}
          className="rounded-lg border bg-background px-3 py-2 text-sm"
          value={venueName}
          disabled={pending}
          autoComplete="off"
          data-lpignore="true"
          data-form-type="other"
          onChange={(event) => setVenueName(event.target.value)}
        />
        {showGoogleNameHint ? (
          <p className="text-muted-foreground text-xs">
            Nom Google : <span className="text-foreground">{googleName}</span>
            {" · "}
            <button
              type="button"
              className="text-primary underline-offset-2 hover:underline"
              disabled={pending}
              onClick={() => setVenueName(googleName)}
            >
              Utiliser ce nom
            </button>
          </p>
        ) : selectedPlace ? (
          <p className="text-muted-foreground text-xs">
            Le nom Google correspond au nom saisi.
          </p>
        ) : mode === "create" ? (
          <p className="text-muted-foreground text-xs">
            Nom actuel issu de l&apos;iCal. Vous pouvez le modifier avant
            confirmation.
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={`venue-category-${venue.id}`}
          className="text-sm font-medium"
        >
          Catégorie
        </label>
        <VenueCategorySelect
          venueId={venue.id}
          value={category}
          disabled={pending}
          onChange={setCategory}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={`venue-address-${venue.id}`}
          className="text-sm font-medium"
        >
          {mode === "edit" && originalPlace ? "Adresse actuelle" : "Adresse"}
        </label>
        {mode === "edit" && originalPlace ? (
          <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
            <p className="font-medium">{originalPlace.formattedAddress}</p>
            <p className="text-muted-foreground text-xs">
              {originalPlace.city} · {originalPlace.latitude.toFixed(5)},{" "}
              {originalPlace.longitude.toFixed(5)}
            </p>
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor={`venue-address-search-${venue.id}`}
          className="text-sm font-medium"
        >
          {mode === "edit" ? "Modifier l'adresse" : "Adresse"}
        </label>
        <GooglePlacesAutocomplete
          key={`${venue.id}-${mode}`}
          id={`venue-address-search-${venue.id}`}
          defaultQuery={mode === "edit" ? "" : addressPlaceholder}
          placeholder={
            mode === "edit"
              ? "Rechercher une nouvelle adresse sur Google…"
              : "Rechercher une adresse sur Google…"
          }
          disabled={pending}
          onSelect={setSelectedPlace}
        />
      </div>

      {selectedPlace && mode === "create" ? (
        <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
          <p className="font-medium">{selectedPlace.formattedAddress}</p>
          <p className="text-muted-foreground text-xs">
            {selectedPlace.city} · {selectedPlace.latitude.toFixed(5)},{" "}
            {selectedPlace.longitude.toFixed(5)}
          </p>
        </div>
      ) : null}

      {hasNewAddressSelection && selectedPlace ? (
        <div className="rounded-md border border-dashed bg-muted/20 px-3 py-2 text-sm">
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
            Nouvelle sélection
          </p>
          <p className="font-medium">{selectedPlace.formattedAddress}</p>
          <p className="text-muted-foreground text-xs">
            {selectedPlace.city} · {selectedPlace.latitude.toFixed(5)},{" "}
            {selectedPlace.longitude.toFixed(5)}
          </p>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          disabled={pending || !selectedPlace || !venueName.trim()}
          onClick={confirm}
        >
          {pending
            ? "Enregistrement…"
            : mode === "edit"
              ? "Enregistrer"
              : "Confirmer"}
        </Button>
        {onCancel ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={onCancel}
          >
            Annuler
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function venueConfirmMode(venue: AdminVenueRow): "create" | "edit" {
  return isVenueAddressConfirmed(venue) ? "edit" : "create";
}
