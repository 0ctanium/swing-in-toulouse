"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { GooglePlacesAutocomplete } from "@/components/admin/google-places-autocomplete";
import { VenueCategorySelect } from "@/components/admin/venue-category-select";
import { VenueIcalQualityBadge } from "@/components/admin/venue-ical-quality-badge";
import { VenuesQualityAlert } from "@/components/admin/venues-quality-alert";
import { VenueCategoryBadge } from "@/components/venues/venue-category-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useConfirmVenue } from "@/lib/admin/use-venues";
import type { VenueCategory } from "@/db/schema";
import type { PlaceDetails } from "@/lib/google/places";
import type { VenueConfirmationEntry } from "@/lib/venues/confirmation";

const CONFIRMED_PAGE_SIZE = 10;

type VenueConfirmPanelProps = {
  pending: VenueConfirmationEntry[];
  confirmed: VenueConfirmationEntry[];
  inactive: VenueConfirmationEntry[];
  activeQualityIssueCount: number;
  googleConfigured: boolean;
};

function initialSearchQuery(venue: VenueConfirmationEntry) {
  if (venue.formattedAddress) {
    return venue.formattedAddress;
  }

  if (venue.address) {
    return `${venue.name}, ${venue.address}, ${venue.city}`;
  }

  return `${venue.name}, ${venue.city}`;
}

function venueToPlaceDetails(
  venue: VenueConfirmationEntry,
): PlaceDetails | null {
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

export function VenueConfirmPanel({
  pending,
  confirmed,
  inactive,
  activeQualityIssueCount,
  googleConfigured,
}: VenueConfirmPanelProps) {
  if (!googleConfigured) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Google Maps requis</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            Ajoutez <code>GOOGLE_MAPS_API_KEY</code> dans{" "}
            <code>.env.local</code> (Places API + Geocoding API activées) pour
            confirmer les adresses.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <VenuesQualityAlert count={activeQualityIssueCount} />

      {pending.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {pending.length} lieu{pending.length > 1 ? "x" : ""} à confirmer
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-muted-foreground text-sm">
              Recherchez l&apos;adresse via Google, ajustez le nom si besoin,
              puis confirmez. Seuls les lieux avec au moins un événement actif
              sont listés.
            </p>
            <ul className="flex flex-col gap-4">
              {pending.map((venue) => (
                <li key={venue.id}>
                  <VenueConfirmRow venue={venue} />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8">
            <p className="text-muted-foreground text-sm">
              Tous les lieux actifs ont une adresse confirmée via Google.
            </p>
          </CardContent>
        </Card>
      )}

      {confirmed.length > 0 ? (
        <ConfirmedVenuesList venues={confirmed} />
      ) : null}

      {inactive.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Lieux inactifs ({inactive.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-muted-foreground text-sm">
              Ces lieux n&apos;ont aucun événement actif et ne sont pas
              confirmés via Google. La confirmation reste optionnelle.
            </p>
            <ul className="flex flex-col gap-4">
              {inactive.map((venue) => (
                <li key={venue.id}>
                  <VenueConfirmRow venue={venue} />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function ConfirmedVenuesList({ venues }: { venues: VenueConfirmationEntry[] }) {
  const [page, setPage] = useState(1);
  const [editingVenueId, setEditingVenueId] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(venues.length / CONFIRMED_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * CONFIRMED_PAGE_SIZE;
  const pageVenues = venues.slice(pageStart, pageStart + CONFIRMED_PAGE_SIZE);

  function goToPage(nextPage: number) {
    setPage(Math.min(Math.max(1, nextPage), totalPages));
    setEditingVenueId(null);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
        <CardTitle className="text-lg">
          Lieux confirmés ({venues.length})
        </CardTitle>
        {totalPages > 1 ? (
          <p className="text-muted-foreground text-sm">
            Page {currentPage} / {totalPages}
          </p>
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <ul className="flex flex-col gap-3 text-sm">
          {pageVenues.map((venue) => (
            <li key={venue.id} className="flex flex-col gap-3">
              <div className="rounded-md border px-3 py-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{venue.name}</p>
                      <VenueCategoryBadge category={venue.category} />
                    </div>
                    <VenueIcalQualityBadge issues={venue.iCalIssues} />
                    <p className="text-muted-foreground text-xs">
                      Slug :{" "}
                      <Link
                        href={`/lieu/${venue.slug}`}
                        className="hover:underline"
                      >
                        /lieu/{venue.slug}
                      </Link>
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {venue.eventCount} événement
                      {venue.eventCount > 1 ? "s" : ""} · {venue.city}
                      {venue.overrideCount > 0
                        ? ` · ${venue.overrideCount} override${venue.overrideCount > 1 ? "s" : ""}`
                        : ""}
                    </p>
                    <p className="text-muted-foreground text-xs">
                      Google : {venue.formattedAddress ?? "—"}
                    </p>
                    {venue.address &&
                    venue.address !== venue.formattedAddress ? (
                      <p className="text-muted-foreground text-xs">
                        iCal : {venue.address}
                      </p>
                    ) : null}
                    {venue.latitude != null && venue.longitude != null ? (
                      <p className="text-muted-foreground text-xs">
                        GPS : {venue.latitude.toFixed(5)},{" "}
                        {venue.longitude.toFixed(5)}
                      </p>
                    ) : null}
                    <label className="mt-1 flex max-w-xs flex-col gap-1 text-xs">
                      <span className="font-medium">Catégorie</span>
                      <VenueCategorySelect
                        venueId={venue.id}
                        value={venue.category}
                        saveOnChange
                      />
                    </label>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Link
                      href={`/lieu/${venue.slug}`}
                      className="inline-flex h-8 items-center justify-center rounded-md border bg-background px-3 text-xs font-medium hover:bg-muted"
                    >
                      Voir
                    </Link>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        setEditingVenueId((current) =>
                          current === venue.id ? null : venue.id,
                        )
                      }
                    >
                      {editingVenueId === venue.id ? "Fermer" : "Modifier"}
                    </Button>
                  </div>
                </div>
              </div>

              {editingVenueId === venue.id ? (
                <VenueConfirmRow
                  venue={venue}
                  mode="edit"
                  onCancel={() => setEditingVenueId(null)}
                  onSaved={() => setEditingVenueId(null)}
                />
              ) : null}
            </li>
          ))}
        </ul>

        {totalPages > 1 ? (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={currentPage <= 1}
              onClick={() => goToPage(currentPage - 1)}
            >
              ← Précédent
            </Button>
            <p className="text-muted-foreground text-xs">
              {pageStart + 1}–{Math.min(pageStart + CONFIRMED_PAGE_SIZE, venues.length)}{" "}
              sur {venues.length}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={currentPage >= totalPages}
              onClick={() => goToPage(currentPage + 1)}
            >
              Suivant →
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

type VenueConfirmRowProps = {
  venue: VenueConfirmationEntry;
  mode?: "create" | "edit";
  onCancel?: () => void;
  onSaved?: () => void;
};

function VenueConfirmRow({
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
    <div className="flex flex-col gap-4 rounded-lg border p-4">
      <VenueIcalQualityBadge issues={venue.iCalIssues} />

      {mode === "create" ? (
        <div className="flex flex-wrap items-start justify-between gap-2">
          <p className="text-muted-foreground text-xs">
            {venue.eventCount} événement{venue.eventCount > 1 ? "s" : ""} ·{" "}
            {venue.address ?? "adresse iCal incomplète"}
          </p>
          <Link
            href={`/lieu/${venue.slug}`}
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
        {mode === "edit" && onCancel ? (
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
