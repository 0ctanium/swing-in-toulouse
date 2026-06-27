"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { EntitySuggestionHints } from "@/components/admin/entity-suggestion-hints";
import { OrganizationSelect } from "@/components/admin/organization-select";
import { EventCategoryTagsInput } from "@/components/admin/event-category-tags-input";
import {
  VenueSelect,
  type VenueSelectOption,
} from "@/components/admin/venue-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EntitySelect } from "@/components/ui/entity-select";
import { useConfirmEvent } from "@/lib/admin/use-events-admin";
import type { EventConfirmQueueItem } from "@/lib/events/confirm-queue";
import { formatEventDate } from "@/lib/events/format";
import {
  buildMasterOverridePatch,
  hasMasterOverrideChangesFromForm,
} from "@/lib/events/override-patch";
import { suggestNamedEntitiesFromText } from "@/lib/proper-names/match-in-text";
import {
  buildOrganizationMatchCandidates,
  type VenueMatchCandidate,
} from "@/lib/venues/match-candidates";

type OrganizationOption = { id: string; name: string };

type EventConfirmFormProps = {
  item: EventConfirmQueueItem;
  organizations: OrganizationOption[];
  venues: VenueSelectOption[];
  venueMatchCandidates: VenueMatchCandidate[];
  onConfirmed: () => void;
  onSkip: () => void;
};

function Field({
  label,
  syncedValue,
  children,
}: {
  label: string;
  syncedValue?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 text-sm">
      <span className="font-medium">{label}</span>
      {syncedValue ? (
        <span className="text-muted-foreground text-xs">
          iCal : {syncedValue}
        </span>
      ) : null}
      {children}
    </div>
  );
}

export function EventConfirmForm({
  item,
  organizations,
  venues,
  venueMatchCandidates,
  onConfirmed,
  onSkip,
}: EventConfirmFormProps) {
  const confirmEvent = useConfirmEvent();
  const { synced, currentPatch } = item;

  const [title, setTitle] = useState(currentPatch.title ?? synced.title);
  const [description, setDescription] = useState(
    currentPatch.description ?? synced.description ?? "",
  );
  const [organizationId, setOrganizationId] = useState(
    currentPatch.organizationId ?? synced.organizationId ?? "",
  );
  const [venueId, setVenueId] = useState(
    currentPatch.venueId ?? synced.venueId ?? "",
  );
  const [categories, setCategories] = useState(
    currentPatch.categories ?? synced.categories ?? [],
  );
  const [status, setStatus] = useState(currentPatch.status ?? synced.status);
  const [sourceUrl, setSourceUrl] = useState(
    currentPatch.sourceUrl ?? synced.sourceUrl ?? "",
  );
  const [notes, setNotes] = useState(currentPatch.notes ?? "");
  const pending = confirmEvent.isPending;

  const organizationLabelsById = useMemo(
    () => new Map(organizations.map((organization) => [organization.id, organization.name])),
    [organizations],
  );
  const venueLabelsById = useMemo(
    () => new Map(venues.map((venue) => [venue.id, venue.name])),
    [venues],
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
        candidates: venueMatchCandidates,
        labelsById: venueLabelsById,
        selectedId: venueId,
      }),
    [title, description, venueMatchCandidates, venueLabelsById, venueId],
  );

  const hasChanges = hasMasterOverrideChangesFromForm(
    {
      title,
      description,
      organizationId,
      venueId,
      categories,
      status,
      sourceUrl,
      notes,
    },
    synced,
  );
  const confirmLabel = hasChanges
    ? "Confirmer les modifications"
    : "Confirmer sans modification";

  async function handleConfirm() {
    const patch = buildMasterOverridePatch(
      {
        title,
        description,
        organizationId,
        venueId,
        categories,
        status,
        sourceUrl,
        notes,
      },
      synced,
    );

    try {
      await confirmEvent.mutateAsync({
        eventId: item.id,
        patch,
      });
      toast.success("Événement confirmé.");
      onConfirmed();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Confirmation impossible.",
      );
    }
  }

  return (
    <Card>
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-2">
            <CardTitle className="text-xl">{item.title}</CardTitle>
            <p className="text-muted-foreground text-sm">
              {item.recurrenceRule && item.nextOccurrenceAt
                ? `Prochaine occurrence : ${formatEventDate(
                    new Date(item.nextOccurrenceAt),
                    item.endAt ? new Date(item.endAt) : null,
                    item.isAllDay,
                  )}`
                : formatEventDate(
                    new Date(item.startAt),
                    item.endAt ? new Date(item.endAt) : null,
                    item.isAllDay,
                  )}
            </p>
            <p className="text-muted-foreground text-sm">
              Source : {item.sourceName}
              {item.recurrenceRule ? " · série récurrente" : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {item.venueNeedsConfirmation ? (
              <Badge variant="outline">Lieu non confirmé</Badge>
            ) : null}
            {item.recurrenceRule ? (
              <Badge variant="secondary">Série récurrente</Badge>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Field label="Titre" syncedValue={synced.title}>
          <input
            className="rounded-lg border bg-background px-3 py-2"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </Field>

        <Field label="Description" syncedValue={synced.description}>
          <textarea
            className="min-h-24 rounded-lg border bg-background px-3 py-2"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </Field>

        <Field label="Organisateur">
          <div className="flex flex-col gap-1.5">
            <OrganizationSelect
              organizations={organizations}
              value={organizationId}
              onChange={setOrganizationId}
            />
            <EntitySuggestionHints
              label="Organisateur suggéré"
              suggestions={suggestedOrganizations}
              disabled={pending}
              onSelect={setOrganizationId}
            />
          </div>
        </Field>

        <Field label="Lieu">
          <div className="flex flex-col gap-1.5">
            <VenueSelect
              venues={venues}
              value={venueId}
              onChange={setVenueId}
            />
            <EntitySuggestionHints
              label="Lieu suggéré"
              suggestions={suggestedVenues}
              disabled={pending}
              onSelect={setVenueId}
            />
          </div>
        </Field>

        <Field label="Catégories" syncedValue={synced.categories?.join(", ")}>
          <EventCategoryTagsInput
            value={categories}
            onChange={setCategories}
            title={title}
            description={description}
            disabled={pending}
          />
        </Field>

        <Field label="Statut">
          <EntitySelect
            value={status}
            onChange={(nextStatus) =>
              setStatus(nextStatus as "published" | "cancelled")
            }
            placeholder="Choisir un statut…"
            options={[
              { value: "published", label: "Publié" },
              { value: "cancelled", label: "Annulé" },
            ]}
          />
        </Field>

        <Field label="URL externe" syncedValue={synced.sourceUrl}>
          <input
            className="rounded-lg border bg-background px-3 py-2"
            value={sourceUrl}
            onChange={(event) => setSourceUrl(event.target.value)}
          />
        </Field>

        <Field label="Notes internes">
          <textarea
            className="min-h-16 rounded-lg border bg-background px-3 py-2"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </Field>

        <div className="flex flex-wrap gap-2">
          <Button onClick={handleConfirm} disabled={pending}>
            {pending ? "Confirmation…" : confirmLabel}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={onSkip}
          >
            Passer
          </Button>
          <Button
            variant="ghost"
            nativeButton={false}
            render={<Link href={`/admin/events/${item.id}`} />}
          >
            Fiche complète
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
