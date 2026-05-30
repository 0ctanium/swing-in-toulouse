"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type {
  LocationVenueConflict,
  SimilarVenueGroup,
  VenueWithStats,
} from "@/lib/venues/matching";
import type { VenueAssignmentDebug } from "@/lib/venues/matching-debug";

type VenueMatchingToolProps = {
  venues: VenueWithStats[];
  similarGroups: SimilarVenueGroup[];
  locationConflicts: LocationVenueConflict[];
};

type BulkAssignPayload = {
  targetVenueId: string;
  sourceVenueIds?: string[];
  locationKey?: string;
  locationKeys?: string[];
};

function VenueSelect({
  venues,
  value,
  onChange,
  placeholder,
}: {
  venues: VenueWithStats[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <select
      className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="">{placeholder}</option>
      {venues.map((venue) => (
        <option key={venue.id} value={venue.id}>
          {venue.name} ({venue.eventCount} évén.)
        </option>
      ))}
    </select>
  );
}

export function VenueMatchingTool({
  venues,
  similarGroups,
  locationConflicts,
}: VenueMatchingToolProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [targetVenueId, setTargetVenueId] = useState("");
  const [selectedSourceVenueIds, setSelectedSourceVenueIds] = useState<string[]>(
    [],
  );
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [previewCount, setPreviewCount] = useState<number | null>(null);

  const filteredVenues = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return venues;
    }

    return venues.filter(
      (venue) =>
        venue.name.toLowerCase().includes(query) ||
        venue.slug.includes(query) ||
        venue.address?.toLowerCase().includes(query),
    );
  }, [search, venues]);

  function toggleSourceVenue(venueId: string) {
    setSelectedSourceVenueIds((current) =>
      current.includes(venueId)
        ? current.filter((id) => id !== venueId)
        : [...current, venueId],
    );
    setPreviewCount(null);
  }

  async function runBulkAssign(
    payload: BulkAssignPayload,
    pendingId: string,
    dryRun = false,
  ) {
    setPendingKey(pendingId);

    try {
      const body = { ...payload, dryRun, debug: true };
      console.log("[venue-matching] client request", body);

      const response = await fetch("/api/admin/venues/bulk-assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = (await response.json()) as {
        error?: string;
        matched?: number;
        updated?: number;
        debug?: Pick<VenueAssignmentDebug, "stages"> & {
          matchedEventIds?: string[];
          sampleTraces?: VenueAssignmentDebug["sampleTraces"];
          locationKeysUsed?: string[];
          target?: string;
        };
      };

      console.log("[venue-matching] client response", {
        ok: response.ok,
        status: response.status,
        data,
      });

      if (!response.ok) {
        throw new Error(data.error ?? "Correction impossible.");
      }

      if (dryRun) {
        setPreviewCount(data.matched ?? 0);
        toast.info(
          `${data.matched ?? 0} événement${data.matched === 1 ? "" : "s"} concerné${data.matched === 1 ? "" : "s"}.`,
          {
            description: data.debug
              ? `Voir la console (F12) pour le détail — exclu cible: ${data.debug.stages.excludedAlreadyAtTarget}, sans match: ${data.debug.stages.excludedNoSourceMatch}`
              : undefined,
          },
        );
        return;
      }

      const updated = data.updated ?? 0;
      if (updated === 0) {
        toast.warning("Aucun événement à corriger (déjà à jour).", {
          description: data.debug
            ? `Traces dans la console — déjà cible: ${data.debug.stages.excludedAlreadyAtTarget}, sans match: ${data.debug.stages.excludedNoSourceMatch}`
            : "Ouvrez la console (F12) pour le détail.",
        });
      } else {
        toast.success(
          `${updated} événement${updated === 1 ? "" : "s"} corrigé${updated === 1 ? "" : "s"}.`,
        );
      }

      setSelectedSourceVenueIds([]);
      setTargetVenueId("");
      setPreviewCount(null);
      router.refresh();
    } catch (assignError) {
      toast.error(
        assignError instanceof Error
          ? assignError.message
          : "Correction impossible.",
      );
    } finally {
      setPendingKey(null);
    }
  }

  function applySimilarGroup(group: SimilarVenueGroup, targetId: string) {
    const sourceIds = group.venues
      .map((venue) => venue.id)
      .filter((id) => id !== targetId);

    return runBulkAssign(
      {
        targetVenueId: targetId,
        sourceVenueIds: sourceIds,
        locationKeys: group.locationKeys,
      },
      `group:${group.key}`,
    );
  }

  function applyLocationConflict(
    conflict: LocationVenueConflict,
    targetId: string,
  ) {
    return runBulkAssign(
      {
        targetVenueId: targetId,
        locationKey: conflict.locationKey,
      },
      `location:${conflict.locationKey}`,
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Réassignation manuelle</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-muted-foreground text-sm">
            Sélectionnez un ou plusieurs lieux sources, puis le lieu cible.
            Les corrections sont enregistrées comme overrides (non écrasés par
            la sync iCal).
          </p>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Rechercher un lieu</span>
            <input
              className="rounded-lg border bg-background px-3 py-2"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nom, slug ou adresse…"
            />
          </label>

          <div className="max-h-64 overflow-y-auto rounded-lg border">
            <ul className="divide-y">
              {filteredVenues.map((venue) => (
                <li key={venue.id} className="flex items-center gap-3 px-3 py-2">
                  <input
                    type="checkbox"
                    checked={selectedSourceVenueIds.includes(venue.id)}
                    onChange={() => toggleSourceVenue(venue.id)}
                    disabled={venue.id === targetVenueId}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{venue.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {venue.eventCount} événement
                      {venue.eventCount > 1 ? "s" : ""}
                      {venue.address ? ` · ${venue.address}` : ""}
                    </p>
                  </div>
                  <Link
                    href={`/lieu/${venue.slug}`}
                    className="text-muted-foreground text-xs hover:underline"
                  >
                    Voir
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Lieu cible</span>
            <VenueSelect
              venues={venues}
              value={targetVenueId}
              onChange={(value) => {
                setTargetVenueId(value);
                setPreviewCount(null);
              }}
              placeholder="Choisir le lieu principal…"
            />
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={
                !targetVenueId ||
                selectedSourceVenueIds.length === 0 ||
                pendingKey !== null
              }
              onClick={() =>
                runBulkAssign(
                  {
                    targetVenueId,
                    sourceVenueIds: selectedSourceVenueIds.filter(
                      (id) => id !== targetVenueId,
                    ),
                  },
                  "manual:preview",
                  true,
                )
              }
            >
              Prévisualiser
            </Button>
            <Button
              type="button"
              disabled={
                !targetVenueId ||
                selectedSourceVenueIds.length === 0 ||
                pendingKey !== null
              }
              onClick={() =>
                runBulkAssign(
                  {
                    targetVenueId,
                    sourceVenueIds: selectedSourceVenueIds.filter(
                      (id) => id !== targetVenueId,
                    ),
                  },
                  "manual:apply",
                )
              }
            >
              {pendingKey === "manual:apply"
                ? "Application…"
                : "Appliquer la correction"}
            </Button>
            {previewCount !== null ? (
              <span className="text-muted-foreground text-sm">
                {previewCount} événement{previewCount > 1 ? "s" : ""} concerné
                {previewCount > 1 ? "s" : ""}
              </span>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {similarGroups.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Lieux similaires</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-muted-foreground text-sm">
              Regroupements détectés par similarité de nom (variantes
              d&apos;orthographe, adresses différentes).
            </p>
            {similarGroups.map((group) => (
              <SimilarGroupRow
                key={group.key}
                group={group}
                pendingKey={pendingKey}
                onApply={(targetId) => applySimilarGroup(group, targetId)}
              />
            ))}
          </CardContent>
        </Card>
      ) : null}

      {locationConflicts.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">LOCATION iCal incohérentes</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-muted-foreground text-sm">
              Même nom de lieu dans iCal (<code>LOCATION</code>) rattaché à
              plusieurs venues différentes.
            </p>
            {locationConflicts.map((conflict) => (
              <LocationConflictRow
                key={conflict.locationKey}
                conflict={conflict}
                venues={venues}
                pendingKey={pendingKey}
                onApply={(targetId) =>
                  applyLocationConflict(conflict, targetId)
                }
              />
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function SimilarGroupRow({
  group,
  pendingKey,
  onApply,
}: {
  group: SimilarVenueGroup;
  pendingKey: string | null;
  onApply: (targetId: string) => void;
}) {
  const [targetVenueId, setTargetVenueId] = useState(group.venues[0]?.id ?? "");

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4">
      <ul className="flex flex-col gap-2 text-sm">
        {group.venues.map((venue) => (
          <li
            key={venue.id}
            className="flex items-center justify-between gap-2"
          >
            <span>
              {venue.name} · {venue.eventCount} évén.
            </span>
            <Link
              href={`/lieu/${venue.slug}`}
              className="text-muted-foreground text-xs hover:underline"
            >
              /lieu/{venue.slug}
            </Link>
          </li>
        ))}
      </ul>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm">
          <span className="font-medium">Conserver comme principal</span>
          <VenueSelect
            venues={group.venues}
            value={targetVenueId}
            onChange={setTargetVenueId}
            placeholder="Choisir…"
          />
        </label>
        <Button
          type="button"
          disabled={!targetVenueId || pendingKey !== null}
          onClick={() => onApply(targetVenueId)}
        >
          {pendingKey === `group:${group.key}`
            ? "Fusion…"
            : "Fusionner vers le principal"}
        </Button>
      </div>
    </div>
  );
}

function LocationConflictRow({
  conflict,
  venues,
  pendingKey,
  onApply,
}: {
  conflict: LocationVenueConflict;
  venues: VenueWithStats[];
  pendingKey: string | null;
  onApply: (targetId: string) => void;
}) {
  const [targetVenueId, setTargetVenueId] = useState(
    conflict.variants.find((variant) => variant.venueId)?.venueId ?? "",
  );

  const totalEvents = conflict.variants.reduce(
    (sum, variant) => sum + variant.eventCount,
    0,
  );

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4">
      <div>
        <p className="font-medium">{conflict.sampleLocationRaw}</p>
        <p className="text-muted-foreground text-xs">
          {totalEvents} événement{totalEvents > 1 ? "s" : ""} · clé{" "}
          <code>{conflict.locationKey}</code>
        </p>
      </div>
      <ul className="text-sm">
        {conflict.variants.map((variant) => (
          <li key={`${variant.venueId ?? "none"}-${variant.eventCount}`}>
            {variant.venueName ?? "Sans lieu"} — {variant.eventCount} évén.
          </li>
        ))}
      </ul>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm">
          <span className="font-medium">Lieu cible</span>
          <VenueSelect
            venues={venues}
            value={targetVenueId}
            onChange={setTargetVenueId}
            placeholder="Choisir le lieu…"
          />
        </label>
        <Button
          type="button"
          disabled={!targetVenueId || pendingKey !== null}
          onClick={() => onApply(targetVenueId)}
        >
          {pendingKey === `location:${conflict.locationKey}`
            ? "Correction…"
            : "Corriger en masse"}
        </Button>
      </div>
    </div>
  );
}
