"use client";

import { useMemo, useState } from "react";

import { VenuePicker } from "@/components/admin/venue-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useUpdateOrganization } from "@/lib/admin/use-organizations";
import type { OrganizationCategory } from "@/db/schema";
import { organizationCategoryOptions } from "@/lib/organizations/categories";
import { formatVenueAsDefaultLocation } from "@/lib/sources/defaults";
import type { VenueWithStats } from "@/lib/venues/matching";

export type OrganizationSettingsEntry = {
  id: string;
  name: string;
  slug: string;
  website: string | null;
  category: OrganizationCategory | null;
  locationRaw: string | null;
  venueName: string | null;
  venueSlug: string | null;
};

type OrganizationSettingsFormProps = {
  organization: OrganizationSettingsEntry;
  venues: VenueWithStats[];
};

export function OrganizationSettingsForm({
  organization,
  venues,
}: OrganizationSettingsFormProps) {
  const updateOrganization = useUpdateOrganization(organization.id);
  const [category, setCategory] = useState(organization.category ?? "");
  const [locationRaw, setLocationRaw] = useState(organization.locationRaw ?? "");
  const [selectedVenueId, setSelectedVenueId] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const pending = updateOrganization.isPending;

  const linkedVenueLabel = useMemo(() => {
    if (organization.venueName && organization.venueSlug) {
      return `${organization.venueName} (/lieu/${organization.venueSlug})`;
    }

    return null;
  }, [organization.venueName, organization.venueSlug]);

  function applyVenueDefault(venueId: string) {
    setSelectedVenueId(venueId);

    if (!venueId) {
      return;
    }

    const venue = venues.find((entry) => entry.id === venueId);
    if (!venue) {
      return;
    }

    setLocationRaw(formatVenueAsDefaultLocation(venue));
  }

  async function save() {
    setMessage(null);

    try {
      await updateOrganization.mutateAsync({
        category: category ? (category as OrganizationCategory) : null,
        locationRaw: locationRaw.trim() || null,
      });
      setMessage("Organisateur enregistré.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Enregistrement impossible.",
      );
    }
  }

  async function clearLocation() {
    setLocationRaw("");
    setSelectedVenueId("");
    setMessage(null);

    try {
      await updateOrganization.mutateAsync({
        locationRaw: null,
      });
      setMessage("Lieu supprimé.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Suppression impossible.",
      );
    }
  }

  return (
    <Card>
      <CardHeader className="gap-1">
        <CardTitle className="text-lg">{organization.name}</CardTitle>
        <p className="text-muted-foreground text-sm">/organisateur/{organization.slug}</p>
        {organization.website ? (
          <p className="text-muted-foreground break-all text-xs">
            {organization.website}
          </p>
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Catégorie</span>
          <select
            className="rounded-lg border bg-background px-3 py-2"
            value={category}
            disabled={pending}
            onChange={(event) => setCategory(event.target.value)}
          >
            <option value="">— Non catégorisé —</option>
            {organizationCategoryOptions().map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Lieu (location_raw)</span>
          <VenuePicker
            venues={venues}
            value={selectedVenueId}
            onChange={applyVenueDefault}
            placeholder="Choisir un lieu existant…"
            disabled={pending}
          />
          <input
            className="rounded-lg border bg-background px-3 py-2"
            value={locationRaw}
            disabled={pending}
            placeholder="Ex. TRAC L'Ecole, 43 Rue Alfred Dumeril, Toulouse"
            onChange={(event) => {
              setSelectedVenueId("");
              setLocationRaw(event.target.value);
            }}
          />
          {linkedVenueLabel ? (
            <span className="text-muted-foreground text-xs">
              Lieu lié : {linkedVenueLabel}
            </span>
          ) : null}
        </label>

        <div className="flex flex-wrap gap-2">
          <Button onClick={save} disabled={pending}>
            {pending ? "Enregistrement…" : "Enregistrer"}
          </Button>
          {locationRaw.trim() || organization.locationRaw ? (
            <Button variant="outline" onClick={clearLocation} disabled={pending}>
              Effacer le lieu
            </Button>
          ) : null}
        </div>

        {message ? <p className="text-sm">{message}</p> : null}
      </CardContent>
    </Card>
  );
}
