"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
import {
  defaultRecurrenceFormValue,
  EventRecurrenceInput,
} from "@/components/admin/event-recurrence-input";
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
import { useCreateManualEvent } from "@/lib/admin/use-events-admin";
import {
  buildScheduleIso,
  defaultEventScheduleValue,
  type EventScheduleValue,
} from "@/lib/events/manual-event-schedule";
import type { RecurrenceFormValue } from "@/lib/events/recurrence-rule";
import { parseOfferDrafts } from "@/lib/events/offers";
import { suggestNamedEntitiesFromText } from "@/lib/proper-names/match-in-text";
import type { VenueSelectOption } from "@/lib/venues/select-options";
import {
  buildOrganizationMatchCandidates,
  type VenueMatchCandidate,
} from "@/lib/venues/match-candidates";

type OrganizationOption = { id: string; name: string };

type EventCreateFormProps = {
  organizations: OrganizationOption[];
  venues: VenueSelectOption[];
  venueMatchCandidates: VenueMatchCandidate[];
  lockedOrganizationId?: string | null;
};

const INPUT_CLASS =
  "w-full rounded-lg border bg-background px-3 py-2 text-sm";

export function EventCreateForm({
  organizations,
  venues,
  venueMatchCandidates,
  lockedOrganizationId = null,
}: EventCreateFormProps) {
  const router = useRouter();
  const createEvent = useCreateManualEvent();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [organizationId, setOrganizationId] = useState(
    lockedOrganizationId ?? "",
  );
  const [venueId, setVenueId] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [status, setStatus] = useState<"published" | "cancelled">("published");
  const [sourceUrl, setSourceUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [schedule, setSchedule] = useState<EventScheduleValue>(
    defaultEventScheduleValue,
  );
  const [recurrence, setRecurrence] = useState<RecurrenceFormValue>(() =>
    defaultRecurrenceFormValue(),
  );
  const initialOffersState = resolveInitialOffersFormState({
    currentPatchOffers: undefined,
    syncedOffers: null,
  });
  const [offersMode, setOffersMode] = useState(initialOffersState.mode);
  const [offerRows, setOfferRows] = useState(initialOffersState.rows);
  const [createdVenues, setCreatedVenues] = useState<VenueSelectOption[]>([]);
  const pending = createEvent.isPending;
  const organizationLocked = Boolean(lockedOrganizationId);

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

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!title.trim()) {
      toast.error("Le titre est requis.");
      return;
    }

    if (!offersFormIsValid(offersMode, offerRows)) {
      toast.error("Vérifiez les tarifs saisis.");
      return;
    }

    let scheduleIso: ReturnType<typeof buildScheduleIso>;

    try {
      scheduleIso = buildScheduleIso(schedule);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Horaires invalides.",
      );
      return;
    }

    const offersPatch = buildOffersPatchFromForm({
      mode: offersMode,
      rows: offerRows,
      syncedOffers: null,
      currentPatchOffers: undefined,
    });
    const offers =
      offersPatch.offers !== undefined
        ? offersPatch.offers
        : parseOfferDrafts(offersMode, offerRows);

    try {
      const result = await createEvent.mutateAsync({
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
        recurrence,
      });

      toast.success("Événement créé.");
      router.push(`/admin/events/${result.event.id}`);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Création impossible.",
      );
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informations générales</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <Label htmlFor="event-title">Titre</Label>
            <input
              id="event-title"
              className={INPUT_CLASS}
              value={title}
              required
              disabled={pending}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <Label htmlFor="event-description">Description</Label>
            <textarea
              id="event-description"
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
          <CardTitle className="text-lg">Répétition</CardTitle>
        </CardHeader>
        <CardContent>
          <EventRecurrenceInput
            value={recurrence}
            onChange={setRecurrence}
            schedule={schedule}
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
            <Label htmlFor="event-source-url">Lien source</Label>
            <input
              id="event-source-url"
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
            <Label htmlFor="event-notes">Notes internes</Label>
            <textarea
              id="event-notes"
              className="min-h-20 rounded-lg border bg-background px-3 py-2 text-sm"
              value={notes}
              disabled={pending}
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Création…" : "Créer l'événement"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() => router.push("/admin/events")}
        >
          Annuler
        </Button>
      </div>
    </form>
  );
}
