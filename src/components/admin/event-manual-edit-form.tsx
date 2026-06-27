"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { EntitySuggestionHints } from "@/components/admin/entity-suggestion-hints";
import { EventCategoryTagsInput } from "@/components/admin/event-category-tags-input";
import {
  buildOffersPatchFromForm,
  EventOffersInput,
  offersFormIsValid,
  resolveInitialOffersFormState,
} from "@/components/admin/event-offers-input";
import { EventScheduleInput } from "@/components/admin/event-schedule-input";
import { OrganizationSelect } from "@/components/admin/organization-select";
import {
  appendCreatedVenueOption,
  mergeVenueMatchCandidates,
  mergeVenueSelectOptions,
  VenueSelectWithCreate,
} from "@/components/admin/venue-select-with-create";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EntitySelect } from "@/components/ui/entity-select";
import { Label } from "@/components/ui/label";
import {
  useCancelManualEvent,
  useDeleteManualEventPermanently,
  useUpdateManualEvent,
} from "@/lib/admin/use-events-admin";
import type { EventOffer } from "@/lib/events/offers";
import {
  buildScheduleIso,
  scheduleValueFromEvent,
  type EventScheduleValue,
} from "@/lib/events/manual-event-schedule";
import { parseOfferDrafts } from "@/lib/events/offers";
import { suggestNamedEntitiesFromText } from "@/lib/proper-names/match-in-text";
import type { VenueSelectOption } from "@/lib/venues/select-options";
import {
  buildOrganizationMatchCandidates,
  type VenueMatchCandidate,
} from "@/lib/venues/match-candidates";

type OrganizationOption = { id: string; name: string };

export type ManualEventEditInitialValues = {
  title: string;
  description: string | null;
  organizationId: string | null;
  venueId: string | null;
  categories: string[] | null;
  status: "published" | "cancelled";
  sourceUrl: string | null;
  startAt: Date;
  endAt: Date | null;
  isAllDay: boolean;
  offers: EventOffer[] | null;
  notes: string | null;
};

type EventManualEditFormProps = {
  eventId: string;
  initial: ManualEventEditInitialValues;
  organizations: OrganizationOption[];
  venues: VenueSelectOption[];
  venueMatchCandidates: VenueMatchCandidate[];
  lockedOrganizationId?: string | null;
  canPermanentlyDelete?: boolean;
};

const INPUT_CLASS =
  "w-full rounded-lg border bg-background px-3 py-2 text-sm";

export function EventManualEditForm({
  eventId,
  initial,
  organizations,
  venues,
  venueMatchCandidates,
  lockedOrganizationId = null,
  canPermanentlyDelete = false,
}: EventManualEditFormProps) {
  const updateEvent = useUpdateManualEvent(eventId);
  const cancelEvent = useCancelManualEvent(eventId);
  const deleteEvent = useDeleteManualEventPermanently(eventId);

  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description ?? "");
  const [organizationId, setOrganizationId] = useState(
    lockedOrganizationId ?? initial.organizationId ?? "",
  );
  const [venueId, setVenueId] = useState(initial.venueId ?? "");
  const [categories, setCategories] = useState(initial.categories ?? []);
  const [status, setStatus] = useState(initial.status);
  const [sourceUrl, setSourceUrl] = useState(initial.sourceUrl ?? "");
  const [notes, setNotes] = useState(initial.notes ?? "");
  const [schedule, setSchedule] = useState<EventScheduleValue>(() =>
    scheduleValueFromEvent(initial),
  );
  const initialOffersState = resolveInitialOffersFormState({
    currentPatchOffers: initial.offers,
    syncedOffers: null,
  });
  const [offersMode, setOffersMode] = useState(initialOffersState.mode);
  const [offerRows, setOfferRows] = useState(initialOffersState.rows);
  const [createdVenues, setCreatedVenues] = useState<VenueSelectOption[]>([]);
  const pending =
    updateEvent.isPending || cancelEvent.isPending || deleteEvent.isPending;
  const organizationLocked = Boolean(lockedOrganizationId);
  const isCancelled = status === "cancelled";

  const allVenues = useMemo(
    () => mergeVenueSelectOptions(venues, createdVenues),
    [venues, createdVenues],
  );
  const allVenueMatchCandidates = useMemo(
    () => mergeVenueMatchCandidates(venueMatchCandidates, createdVenues),
    [venueMatchCandidates, createdVenues],
  );
  const organizationLabelsById = useMemo(
    () =>
      new Map(organizations.map((organization) => [organization.id, organization.name])),
    [organizations],
  );
  const venueLabelsById = useMemo(
    () => new Map(allVenues.map((venue) => [venue.id, venue.name])),
    [allVenues],
  );
  const organizationMatchCandidates = useMemo(
    () => buildOrganizationMatchCandidates(organizations),
    [organizations],
  );
  const suggestedOrganizations = useMemo(
    () =>
      suggestNamedEntitiesFromText({
        title,
        description,
        candidates: organizationMatchCandidates,
        labelsById: organizationLabelsById,
        selectedId: organizationId,
      }),
    [
      title,
      description,
      organizationMatchCandidates,
      organizationLabelsById,
      organizationId,
    ],
  );
  const suggestedVenues = useMemo(
    () =>
      suggestNamedEntitiesFromText({
        title,
        description,
        candidates: allVenueMatchCandidates,
        labelsById: venueLabelsById,
        selectedId: venueId,
      }),
    [title, description, allVenueMatchCandidates, venueLabelsById, venueId],
  );

  async function buildPayload() {
    if (!title.trim()) {
      toast.error("Le titre est requis.");
      return null;
    }

    if (!offersFormIsValid(offersMode, offerRows)) {
      toast.error("Vérifiez les tarifs saisis.");
      return null;
    }

    let scheduleIso: ReturnType<typeof buildScheduleIso>;

    try {
      scheduleIso = buildScheduleIso(schedule);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Horaires invalides.",
      );
      return null;
    }

    const offersPatch = buildOffersPatchFromForm({
      mode: offersMode,
      rows: offerRows,
      syncedOffers: null,
      currentPatchOffers: initial.offers,
    });
    const offers =
      offersPatch.offers !== undefined
        ? offersPatch.offers
        : parseOfferDrafts(offersMode, offerRows);

    return {
      title: title.trim(),
      description: description.trim() || null,
      startAt: scheduleIso.startAt,
      endAt: scheduleIso.endAt,
      isAllDay: scheduleIso.isAllDay,
      organizationId: organizationId || null,
      venueId: venueId || null,
      categories,
      status,
      sourceUrl: sourceUrl.trim() || null,
      offers,
      notes: notes.trim() || null,
    };
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const payload = await buildPayload();
    if (!payload) {
      return;
    }

    try {
      await updateEvent.mutateAsync(payload);
      toast.success("Événement enregistré.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Enregistrement impossible.",
      );
    }
  }

  async function handleCancelEvent() {
    if (
      !window.confirm(
        "Annuler cet événement ? Il restera visible dans l'admin mais disparaîtra de l'agenda public.",
      )
    ) {
      return;
    }

    try {
      await cancelEvent.mutateAsync();
      setStatus("cancelled");
      toast.success("Événement annulé.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Annulation impossible.",
      );
    }
  }

  async function handleDeletePermanently() {
    if (
      !window.confirm(
        "Supprimer définitivement cet événement ? Cette action est irréversible.",
      )
    ) {
      return;
    }

    try {
      await deleteEvent.mutateAsync();
      toast.success("Événement supprimé.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Suppression impossible.",
      );
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {isCancelled ? (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="pt-6 text-sm">
            Cet événement est annulé. Vous pouvez le republier en changeant le
            statut, ou le supprimer définitivement si vous êtes administrateur
            plateforme.
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informations générales</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <Label htmlFor="manual-event-title">Titre</Label>
            <input
              id="manual-event-title"
              className={INPUT_CLASS}
              value={title}
              required
              disabled={pending}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="manual-event-description">Description</Label>
            <textarea
              id="manual-event-description"
              className="min-h-24 rounded-lg border bg-background px-3 py-2 text-sm"
              value={description}
              disabled={pending}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label>Organisateur</Label>
            <OrganizationSelect
              organizations={organizations}
              value={organizationId}
              disabled={pending || organizationLocked}
              onChange={setOrganizationId}
            />
            {!organizationLocked ? (
              <EntitySuggestionHints
                label="Organisateur suggéré"
                suggestions={suggestedOrganizations}
                disabled={pending}
                onSelect={setOrganizationId}
              />
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Date et horaire</CardTitle>
        </CardHeader>
        <CardContent>
          <EventScheduleInput
            value={schedule}
            onChange={setSchedule}
            disabled={pending}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Lieu et catégories</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <Label>Lieu</Label>
            <VenueSelectWithCreate
              venues={allVenues}
              value={venueId}
              disabled={pending}
              onChange={setVenueId}
              onVenueCreated={(venue) => {
                setCreatedVenues((current) => appendCreatedVenueOption(current, venue));
                setVenueId(venue.id);
              }}
            />
            <EntitySuggestionHints
              label="Lieu suggéré"
              suggestions={suggestedVenues}
              disabled={pending}
              onSelect={setVenueId}
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label>Catégories</Label>
            <EventCategoryTagsInput
              value={categories}
              disabled={pending}
              onChange={setCategories}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Publication</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <Label>Statut</Label>
            <EntitySelect
              value={status}
              disabled={pending}
              onChange={(value) =>
                setStatus(value as "published" | "cancelled")
              }
              options={[
                { value: "published", label: "Publié" },
                { value: "cancelled", label: "Annulé" },
              ]}
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="manual-event-source-url">Lien source</Label>
            <input
              id="manual-event-source-url"
              type="url"
              className={INPUT_CLASS}
              value={sourceUrl}
              disabled={pending}
              placeholder="https://…"
              onChange={(event) => setSourceUrl(event.target.value)}
            />
          </div>

          <EventOffersInput
            mode={offersMode}
            rows={offerRows}
            disabled={pending}
            onModeChange={setOffersMode}
            onRowsChange={setOfferRows}
          />

          <div className="flex flex-col gap-1">
            <Label htmlFor="manual-event-notes">Notes internes</Label>
            <textarea
              id="manual-event-notes"
              className="min-h-20 rounded-lg border bg-background px-3 py-2 text-sm"
              value={notes}
              disabled={pending}
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={pending}>
            {updateEvent.isPending ? "Enregistrement…" : "Enregistrer"}
          </Button>
          {!isCancelled ? (
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => void handleCancelEvent()}
            >
              {cancelEvent.isPending ? "Annulation…" : "Annuler l'événement"}
            </Button>
          ) : null}
        </div>

        {canPermanentlyDelete ? (
          <div className="border-t pt-4">
            <Button
              type="button"
              variant="destructive"
              disabled={pending}
              onClick={() => void handleDeletePermanently()}
            >
              {deleteEvent.isPending
                ? "Suppression…"
                : "Supprimer définitivement"}
            </Button>
          </div>
        ) : null}
      </div>
    </form>
  );
}
