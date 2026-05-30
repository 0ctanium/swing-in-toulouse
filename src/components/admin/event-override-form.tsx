"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useDeleteEventOverride,
  useSaveEventOverride,
} from "@/lib/admin/use-events-admin";
import type { EventOverridePatch } from "@/lib/events/overrides.types";

type OrganizationOption = { id: string; name: string };
type VenueOption = { id: string; name: string };

type EventOverrideFormProps = {
  eventId: string;
  scope: "master" | "occurrence";
  occurrenceStartAt?: string;
  synced: {
    title: string;
    description: string | null;
    locationRaw: string | null;
    organizationId: string | null;
    venueId: string | null;
    categories: string[] | null;
    status: "published" | "cancelled";
    sourceUrl: string | null;
  };
  currentPatch: EventOverridePatch;
  organizations: OrganizationOption[];
  venues: VenueOption[];
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
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium">{label}</span>
      {syncedValue ? (
        <span className="text-muted-foreground text-xs">
          iCal : {syncedValue}
        </span>
      ) : null}
      {children}
    </label>
  );
}

export function EventOverrideForm({
  eventId,
  scope,
  occurrenceStartAt,
  synced,
  currentPatch,
  organizations,
  venues,
}: EventOverrideFormProps) {
  const saveOverride = useSaveEventOverride(eventId);
  const deleteOverride = useDeleteEventOverride(eventId);
  const [title, setTitle] = useState(currentPatch.title ?? "");
  const [description, setDescription] = useState(
    currentPatch.description ?? synced.description ?? "",
  );
  const [locationRaw, setLocationRaw] = useState(
    currentPatch.locationRaw ?? synced.locationRaw ?? "",
  );
  const [organizationId, setOrganizationId] = useState(
    currentPatch.organizationId ?? synced.organizationId ?? "",
  );
  const [venueId, setVenueId] = useState(
    currentPatch.venueId ?? synced.venueId ?? "",
  );
  const [categories, setCategories] = useState(
    (currentPatch.categories ?? synced.categories ?? []).join(", "),
  );
  const [status, setStatus] = useState(
    currentPatch.status ?? synced.status,
  );
  const [sourceUrl, setSourceUrl] = useState(
    currentPatch.sourceUrl ?? synced.sourceUrl ?? "",
  );
  const [hidden, setHidden] = useState(currentPatch.hidden ?? false);
  const [notes, setNotes] = useState(currentPatch.notes ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const pending = saveOverride.isPending || deleteOverride.isPending;

  const scopeLabel = useMemo(
    () =>
      scope === "master"
        ? "Série entière"
        : `Occurrence du ${occurrenceStartAt ? new Date(occurrenceStartAt).toLocaleString("fr-FR") : ""}`,
    [scope, occurrenceStartAt],
  );

  async function save() {
    setMessage(null);

    const patch: EventOverridePatch = {};

    if (title.trim() && title.trim() !== synced.title) {
      patch.title = title.trim();
    }
    if (description !== (synced.description ?? "")) {
      patch.description = description.trim() || null;
    }
    if (locationRaw !== (synced.locationRaw ?? "")) {
      patch.locationRaw = locationRaw.trim() || null;
    }
    if (organizationId !== (synced.organizationId ?? "")) {
      patch.organizationId = organizationId || null;
    }
    if (venueId !== (synced.venueId ?? "")) {
      patch.venueId = venueId || null;
    }

    const parsedCategories = categories
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    const syncedCategories = synced.categories ?? [];
    if (
      JSON.stringify(parsedCategories) !== JSON.stringify(syncedCategories)
    ) {
      patch.categories = parsedCategories;
    }

    if (status !== synced.status) {
      patch.status = status;
    }

    if (sourceUrl !== (synced.sourceUrl ?? "")) {
      patch.sourceUrl = sourceUrl.trim() || null;
    }

    if (scope === "occurrence" && hidden) {
      patch.hidden = true;
    }

    if (notes.trim()) {
      patch.notes = notes.trim();
    }

    try {
      await saveOverride.mutateAsync({
        patch,
        occurrenceStartAt: scope === "occurrence" ? occurrenceStartAt : null,
      });
      setMessage("Override enregistré.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Enregistrement impossible.",
      );
    }
  }

  async function resetOverride() {
    try {
      await deleteOverride.mutateAsync({
        occurrenceStartAt:
          scope === "occurrence" ? occurrenceStartAt : undefined,
      });
    } catch {
      setMessage("Suppression impossible.");
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{scopeLabel}</CardTitle>
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

        <Field label="Lieu (texte brut)" syncedValue={synced.locationRaw}>
          <input
            className="rounded-lg border bg-background px-3 py-2"
            value={locationRaw}
            onChange={(event) => setLocationRaw(event.target.value)}
          />
        </Field>

        <Field label="Organisateur">
          <select
            className="rounded-lg border bg-background px-3 py-2"
            value={organizationId}
            onChange={(event) => setOrganizationId(event.target.value)}
          >
            <option value="">— Aucun —</option>
            {organizations.map((organization) => (
              <option key={organization.id} value={organization.id}>
                {organization.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Lieu (venue)">
          <select
            className="rounded-lg border bg-background px-3 py-2"
            value={venueId}
            onChange={(event) => setVenueId(event.target.value)}
          >
            <option value="">— Aucun —</option>
            {venues.map((venue) => (
              <option key={venue.id} value={venue.id}>
                {venue.name}
              </option>
            ))}
          </select>
        </Field>

        <Field
          label="Catégories (séparées par des virgules)"
          syncedValue={synced.categories?.join(", ")}
        >
          <input
            className="rounded-lg border bg-background px-3 py-2"
            value={categories}
            onChange={(event) => setCategories(event.target.value)}
          />
        </Field>

        <Field label="Statut">
          <select
            className="rounded-lg border bg-background px-3 py-2"
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as "published" | "cancelled")
            }
          >
            <option value="published">Publié</option>
            <option value="cancelled">Annulé</option>
          </select>
        </Field>

        <Field label="URL externe" syncedValue={synced.sourceUrl}>
          <input
            className="rounded-lg border bg-background px-3 py-2"
            value={sourceUrl}
            onChange={(event) => setSourceUrl(event.target.value)}
          />
        </Field>

        {scope === "occurrence" ? (
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={hidden}
              onChange={(event) => setHidden(event.target.checked)}
            />
            Masquer cette occurrence
          </label>
        ) : null}

        <Field label="Notes internes">
          <textarea
            className="min-h-16 rounded-lg border bg-background px-3 py-2"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </Field>

        {message ? <p className="text-sm">{message}</p> : null}

        <div className="flex flex-wrap gap-2">
          <Button onClick={save} disabled={pending}>
            {pending ? "Enregistrement…" : "Enregistrer l'override"}
          </Button>
          <Button variant="outline" onClick={resetOverride} disabled={pending}>
            Supprimer l'override
          </Button>
          {scope === "master" ? (
            <Button variant="ghost" render={<Link href="/admin" />}>
              Retour
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
