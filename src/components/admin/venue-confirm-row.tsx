"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { GooglePlacesAutocomplete } from "@/components/admin/google-places-autocomplete";
import { VenueCategorySelect } from "@/components/admin/venue-category-select";
import {
  splitDuplicateCandidates,
  VenueDuplicateAlert,
} from "@/components/admin/venue-duplicate-alert";
import { Button } from "@/components/ui/button";
import { useVenueDuplicateCandidates } from "@/lib/admin/use-venue-duplicates";
import {
  useBulkAssignVenues,
  useConfirmVenue,
  useConfirmVenueArea,
} from "@/lib/admin/use-venues";
import type { VenueCategory, VenueLocationKind } from "@/db/schema";
import type { PlaceDetails } from "@/lib/google/places";
import { useDebouncedValue } from "@/lib/google/use-places";
import type { AdminVenueRow } from "@/lib/venues/admin-venue-row";
import { isVenueAddressConfirmed } from "@/lib/venues/confirmation";
import { duplicateSearchFromPlace } from "@/lib/venues/duplicate-candidates";
import {
  isPreciseVenueLocation,
  venueLocationKindOptions,
} from "@/lib/venues/location-kind";

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
  const confirmVenueArea = useConfirmVenueArea();
  const bulkAssign = useBulkAssignVenues();
  const addressPlaceholder = useMemo(() => initialSearchQuery(venue), [venue]);
  const initialPlace = useMemo(
    () => (mode === "edit" ? venueToPlaceDetails(venue) : null),
    [mode, venue],
  );
  const [venueName, setVenueName] = useState(venue.name);
  const debouncedVenueName = useDebouncedValue(venueName, 300);
  const [category, setCategory] = useState<VenueCategory | null>(
    venue.category,
  );
  const [locationKind, setLocationKind] = useState<VenueLocationKind>(
    venue.locationKind,
  );
  const [city, setCity] = useState(venue.city);
  const [areaAddress, setAreaAddress] = useState(venue.address ?? "");
  const [originalPlace] = useState<PlaceDetails | null>(initialPlace);
  const [selectedPlace, setSelectedPlace] = useState<PlaceDetails | null>(
    initialPlace,
  );
  const isPrecise = isPreciseVenueLocation(locationKind);
  const pending =
    confirmVenue.isPending || confirmVenueArea.isPending || bulkAssign.isPending;

  const weakDuplicateSearch = useMemo(
    () => ({
      name: debouncedVenueName.trim() || venue.name,
      address: venue.address,
      city: venue.city,
      formattedAddress: venue.formattedAddress,
      googlePlaceId: venue.googlePlaceId,
      latitude: venue.latitude,
      longitude: venue.longitude,
      requireAddressSignal: true,
      minConfidence: "possible" as const,
    }),
    [debouncedVenueName, venue],
  );

  const strongDuplicateSearch = useMemo(() => {
    if (!selectedPlace) {
      return null;
    }

    return duplicateSearchFromPlace(venue.id, venueName.trim() || venue.name, {
      placeId: selectedPlace.placeId,
      formattedAddress: selectedPlace.formattedAddress,
      address: selectedPlace.address,
      city: selectedPlace.city,
      latitude: selectedPlace.latitude,
      longitude: selectedPlace.longitude,
    });
  }, [selectedPlace, venue.id, venue.name, venueName]);

  const weakDuplicates = useVenueDuplicateCandidates(
    venue.id,
    isPrecise && mode === "create" ? weakDuplicateSearch : null,
  );
  const strongDuplicates = useVenueDuplicateCandidates(
    venue.id,
    isPrecise ? strongDuplicateSearch : null,
  );

  const duplicateCandidates = selectedPlace
    ? (strongDuplicates.data ?? [])
    : (weakDuplicates.data ?? []);

  const { strong: strongDuplicateMatches, weak: weakDuplicateMatches } =
    useMemo(
      () => splitDuplicateCandidates(duplicateCandidates),
      [duplicateCandidates],
    );

  const hasNewAddressSelection =
    mode === "edit" &&
    originalPlace != null &&
    selectedPlace != null &&
    selectedPlace.placeId !== originalPlace.placeId;

  const googleName = selectedPlace?.name.trim() ?? "";
  const showGoogleNameHint =
    googleName.length > 0 && googleName !== venueName.trim();

  async function setAsAlias(canonicalVenueId: string) {
    try {
      const data = await bulkAssign.mutateAsync({
        payload: {
          targetVenueId: canonicalVenueId,
          assignments: [{ sourceVenueId: venue.id, permanent: true }],
          sourceVenueIds: [venue.id],
        },
      });

      const updated = data.updated ?? 0;
      const aliasesCreated = data.aliasesCreated ?? 0;

      toast.success(
        updated > 0
          ? `Alias permanent créé · ${updated} événement${updated === 1 ? "" : "s"} réassigné${updated === 1 ? "" : "s"}`
          : "Alias permanent créé",
      );
      onSaved?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Alias impossible.",
      );
    }
  }

  async function confirmArea() {
    const trimmedName = venueName.trim();

    if (!trimmedName) {
      toast.error("Le nom du lieu est requis.");
      return;
    }

    if (!city.trim()) {
      toast.error("La ville est requise.");
      return;
    }

    const kind = locationKind === "none" ? "none" : "area";

    try {
      await confirmVenueArea.mutateAsync({
        venueId: venue.id,
        name: trimmedName,
        city: city.trim(),
        address: areaAddress.trim() || null,
        category,
        locationKind: kind,
      });

      toast.success(
        kind === "none"
          ? `${trimmedName} enregistré (sans adresse précise).`
          : `${trimmedName} enregistré comme zone.`,
      );
      onSaved?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Enregistrement impossible.",
      );
    }
  }

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
          Modifiez le type, le nom ou l&apos;adresse, puis enregistrez.
        </p>
      )}

      <fieldset className="flex flex-col gap-2 rounded-lg border p-3">
        <legend className="px-1 text-sm font-medium">Type de lieu</legend>
        <div className="flex flex-col gap-2">
          {venueLocationKindOptions().map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-start gap-2 text-sm"
            >
              <input
                type="radio"
                name={`venue-location-kind-${venue.id}`}
                className="mt-1"
                checked={locationKind === option.value}
                disabled={pending}
                onChange={() => {
                  setLocationKind(option.value);
                  if (!isPreciseVenueLocation(option.value)) {
                    setSelectedPlace(null);
                  }
                }}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
        {!isPrecise ? (
          <p className="text-muted-foreground text-xs">
            Pas de point GPS : la carte publique affiche le libellé sans pin
            Google.
          </p>
        ) : null}
      </fieldset>

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

      {isPrecise ? (
        <>
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor={`venue-address-${venue.id}`}
              className="text-sm font-medium"
            >
              {mode === "edit" && originalPlace
                ? "Adresse actuelle"
                : "Adresse"}
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
              {mode === "edit" ? "Modifier l'adresse" : "Adresse Google"}
            </label>
            <GooglePlacesAutocomplete
              key={`${venue.id}-${mode}-place`}
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
        </>
      ) : (
        <>
          <div className="flex flex-col gap-1.5">
            <label htmlFor={`venue-city-${venue.id}`} className="text-sm font-medium">
              Ville
            </label>
            <input
              id={`venue-city-${venue.id}`}
              className="rounded-lg border bg-background px-3 py-2 text-sm"
              value={city}
              disabled={pending}
              onChange={(event) => setCity(event.target.value)}
            />
          </div>
          {locationKind === "area" ? (
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor={`venue-area-address-${venue.id}`}
                className="text-sm font-medium"
              >
                Précision (optionnel)
              </label>
              <input
                id={`venue-area-address-${venue.id}`}
                className="rounded-lg border bg-background px-3 py-2 text-sm"
                value={areaAddress}
                disabled={pending}
                placeholder="ex. quartier, parc, place…"
                onChange={(event) => setAreaAddress(event.target.value)}
              />
            </div>
          ) : null}
        </>
      )}

      {isPrecise && strongDuplicateMatches.length > 0 ? (
        <VenueDuplicateAlert
          title="Un lieu similaire existe déjà"
          description="Même adresse ou même lieu Google. Vous pouvez créer un alias permanent plutôt que confirmer un doublon."
          candidates={strongDuplicateMatches}
          pending={pending}
          onSetAlias={setAsAlias}
        />
      ) : null}

      {isPrecise && weakDuplicateMatches.length > 0 ? (
        <VenueDuplicateAlert
          title={
            selectedPlace
              ? "Autres correspondances possibles"
              : "Autres lieux à vérifier"
          }
          description={
            selectedPlace
              ? "Correspondance moins certaine — vérifiez avant de fusionner."
              : "Correspondance faible (adresse iCal). Sélectionnez une adresse Google pour affiner."
          }
          candidates={weakDuplicateMatches}
          pending={pending}
          onSetAlias={setAsAlias}
        />
      ) : null}

      <div className="flex flex-wrap gap-2">
        {isPrecise ? (
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
                : "Confirmer l'adresse"}
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            disabled={pending || !venueName.trim() || !city.trim()}
            onClick={confirmArea}
          >
            {pending
              ? "Enregistrement…"
              : locationKind === "none"
                ? "Enregistrer"
                : "Valider la zone"}
          </Button>
        )}
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
  if (!isPreciseVenueLocation(venue.locationKind)) {
    return "edit";
  }

  return isVenueAddressConfirmed(venue) ? "edit" : "create";
}
