"use client";

import { useMemo, useState } from "react";

import { VenuePicker } from "@/components/admin/venue-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUpdateSourceDefaults } from "@/lib/admin/use-sources";
import { formatVenueAsDefaultLocation } from "@/lib/sources/defaults";
import type { VenueWithStats } from "@/lib/venues/matching";

export type SourceDefaultsEntry = {
  id: string;
  name: string;
  slug: string;
  url: string;
  isActive: boolean;
  organizationName: string | null;
  defaultLocationRaw: string | null;
  defaultCategories: string[] | null;
};

type SourceDefaultsFormProps = {
  source: SourceDefaultsEntry;
  venues: VenueWithStats[];
};

function parseCategoriesInput(value: string) {
  return value
    .split(",")
    .map((category) => category.trim())
    .filter(Boolean);
}

export function SourceDefaultsForm({ source, venues }: SourceDefaultsFormProps) {
  const updateDefaults = useUpdateSourceDefaults(source.id);
  const [defaultLocationRaw, setDefaultLocationRaw] = useState(
    source.defaultLocationRaw ?? "",
  );
  const [defaultCategories, setDefaultCategories] = useState(
    (source.defaultCategories ?? []).join(", "),
  );
  const [selectedVenueId, setSelectedVenueId] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const pending = updateDefaults.isPending;

  const hasDefaults = useMemo(
    () =>
      Boolean(defaultLocationRaw.trim()) ||
      parseCategoriesInput(defaultCategories).length > 0,
    [defaultCategories, defaultLocationRaw],
  );

  function applyVenueDefault(venueId: string) {
    setSelectedVenueId(venueId);

    if (!venueId) {
      return;
    }

    const venue = venues.find((entry) => entry.id === venueId);
    if (!venue) {
      return;
    }

    setDefaultLocationRaw(formatVenueAsDefaultLocation(venue));
  }

  async function save() {
    setMessage(null);

    try {
      await updateDefaults.mutateAsync({
        defaultLocationRaw: defaultLocationRaw.trim() || null,
        defaultCategories: parseCategoriesInput(defaultCategories),
      });
      setMessage(
        "Valeurs par défaut enregistrées. Relancez une sync pour les appliquer.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Enregistrement impossible.",
      );
    }
  }

  async function clearDefaults() {
    setDefaultLocationRaw("");
    setDefaultCategories("");
    setSelectedVenueId("");
    setMessage(null);

    try {
      await updateDefaults.mutateAsync({
        defaultLocationRaw: null,
        defaultCategories: null,
      });
      setMessage("Valeurs par défaut supprimées.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Suppression impossible.",
      );
    }
  }

  return (
    <Card>
      <CardHeader className="gap-1">
        <CardTitle className="text-lg">{source.name}</CardTitle>
        <p className="text-muted-foreground text-sm">
          {source.organizationName ?? "Sans organisateur"} ·{" "}
          {source.isActive ? "Active" : "Inactive"}
        </p>
        <p className="text-muted-foreground break-all text-xs">{source.url}</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-muted-foreground text-sm">
          Utilisées à la synchronisation quand l&apos;iCal ne fournit pas de lieu
          ou de catégories. Les événements déjà renseignés dans le flux ne sont
          pas écrasés.
        </p>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Lieu par défaut (location_raw)</span>
          <VenuePicker
            venues={venues}
            value={selectedVenueId}
            onChange={applyVenueDefault}
            placeholder="Choisir un lieu existant…"
            disabled={pending}
          />
          <input
            className="rounded-lg border bg-background px-3 py-2"
            value={defaultLocationRaw}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setSelectedVenueId("");
              setDefaultLocationRaw(event.target.value);
            }}
            placeholder="Ex. Studio Hop, 12 rue Saint-Rome, Toulouse"
            disabled={pending}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Catégories par défaut</span>
          <input
            className="rounded-lg border bg-background px-3 py-2"
            value={defaultCategories}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
              setDefaultCategories(event.target.value)
            }
            placeholder="Ex. Lindy Hop, Soirée"
            disabled={pending}
          />
          <span className="text-muted-foreground text-xs">
            Séparez les catégories par des virgules.
          </span>
        </label>

        <div className="flex flex-wrap gap-2">
          <Button onClick={save} disabled={pending}>
            {pending ? "Enregistrement…" : "Enregistrer"}
          </Button>
          {hasDefaults ? (
            <Button variant="outline" onClick={clearDefaults} disabled={pending}>
              Effacer les défauts
            </Button>
          ) : null}
        </div>

        {message ? <p className="text-sm">{message}</p> : null}
      </CardContent>
    </Card>
  );
}
