"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import {
  VenueMergeCard,
  VenueMergeCardGrid,
} from "@/components/admin/venue-merge-card";
import { VenueRedirectsPanel } from "@/components/admin/venue-redirects-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { VenueRedirectEntry } from "@/lib/venues/canonical";
import type {
  LocationVenueConflict,
  SimilarVenueGroup,
  VenueAssignment,
  VenueWithStats,
} from "@/lib/venues/matching";
import type { VenueAssignmentDebug } from "@/lib/venues/matching-debug";

type VenueMatchingToolProps = {
  venues: VenueWithStats[];
  similarGroups: SimilarVenueGroup[];
  locationConflicts: LocationVenueConflict[];
  venueRedirects: VenueRedirectEntry[];
};

type BulkAssignPayload = {
  targetVenueId: string;
  assignments?: VenueAssignment[];
  sourceVenueIds?: string[];
  locationKey?: string;
  locationKeys?: string[];
};

function buildAssignments(
  sourceIds: string[],
  targetId: string,
  permanentById: Record<string, boolean>,
): VenueAssignment[] {
  return sourceIds
    .filter((id) => id !== targetId)
    .map((sourceVenueId) => ({
      sourceVenueId,
      permanent: permanentById[sourceVenueId] ?? false,
    }));
}

export function VenueMatchingTool({
  venues,
  similarGroups,
  locationConflicts,
  venueRedirects,
}: VenueMatchingToolProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [targetVenueId, setTargetVenueId] = useState("");
  const [selectedSourceVenueIds, setSelectedSourceVenueIds] = useState<string[]>(
    [],
  );
  const [permanentBySourceId, setPermanentBySourceId] = useState<
    Record<string, boolean>
  >({});
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [previewCount, setPreviewCount] = useState<number | null>(null);

  const filteredVenues = useMemo(() => {
    const query = search.trim().toLowerCase();
    const eligible = venues.filter((venue) => !venue.canonicalVenueId);

    if (!query) {
      return eligible;
    }

    return eligible.filter(
      (venue) =>
        venue.name.toLowerCase().includes(query) ||
        venue.slug.includes(query) ||
        venue.address?.toLowerCase().includes(query),
    );
  }, [search, venues]);

  function setPrimary(venueId: string) {
    setTargetVenueId(venueId);
    setSelectedSourceVenueIds((current) =>
      current.filter((id) => id !== venueId),
    );
    setPreviewCount(null);
  }

  function toggleSourceVenue(venueId: string) {
    if (venueId === targetVenueId) {
      return;
    }

    setSelectedSourceVenueIds((current) =>
      current.includes(venueId)
        ? current.filter((id) => id !== venueId)
        : [...current, venueId],
    );
    setPreviewCount(null);
  }

  function togglePermanent(sourceVenueId: string) {
    setPermanentBySourceId((current) => ({
      ...current,
      [sourceVenueId]: !current[sourceVenueId],
    }));
  }

  async function runBulkAssign(
    payload: BulkAssignPayload,
    pendingId: string,
    dryRun = false,
  ) {
    setPendingKey(pendingId);

    try {
      const body = { ...payload, dryRun, debug: true };

      const response = await fetch("/api/admin/venues/bulk-assign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = (await response.json()) as {
        error?: string;
        matched?: number;
        updated?: number;
        aliasesCreated?: number;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Correction impossible.");
      }

      if (dryRun) {
        setPreviewCount(data.matched ?? 0);
        toast.info(
          `${data.matched ?? 0} événement${data.matched === 1 ? "" : "s"} concerné${data.matched === 1 ? "" : "s"}.`,
        );
        return;
      }

      const updated = data.updated ?? 0;
      const aliasesCreated = data.aliasesCreated ?? 0;

      if (updated === 0 && aliasesCreated === 0) {
        toast.warning("Aucun changement appliqué.");
      } else {
        toast.success(
          [
            updated > 0
              ? `${updated} événement${updated === 1 ? "" : "s"} corrigé${updated === 1 ? "" : "s"}`
              : null,
            aliasesCreated > 0
              ? `${aliasesCreated} alias permanent${aliasesCreated === 1 ? "" : "s"}`
              : null,
          ]
            .filter(Boolean)
            .join(" · "),
        );
      }

      setSelectedSourceVenueIds([]);
      setTargetVenueId("");
      setPermanentBySourceId({});
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

  const manualSourceIds = selectedSourceVenueIds.filter(
    (id) => id !== targetVenueId,
  );
  const manualAssignments = buildAssignments(
    manualSourceIds,
    targetVenueId,
    permanentBySourceId,
  );

  return (
    <div className="flex flex-col gap-6">
      <VenueRedirectsPanel redirects={venueRedirects} />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Réassignation manuelle</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-muted-foreground text-sm">
            Choisissez un lieu principal sur une carte, incluez les autres lieux
            à fusionner, puis appliquez.
          </p>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium">Rechercher</span>
            <input
              className="rounded-lg border bg-background px-3 py-2"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nom, slug ou adresse…"
            />
          </label>

          <VenueMergeCardGrid>
            {filteredVenues.map((venue) => {
              const isPrimary = venue.id === targetVenueId;
              const isSource = manualSourceIds.includes(venue.id);

              return (
                <VenueMergeCard
                  key={venue.id}
                  venue={venue}
                  isPrimary={isPrimary}
                  isSource={isSource}
                  permanent={permanentBySourceId[venue.id] ?? false}
                  showSourceToggle
                  disabled={pendingKey !== null}
                  onSetPrimary={() => setPrimary(venue.id)}
                  onToggleSource={() => toggleSourceVenue(venue.id)}
                  onTogglePermanent={() => togglePermanent(venue.id)}
                />
              );
            })}
          </VenueMergeCardGrid>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={
                !targetVenueId ||
                manualAssignments.length === 0 ||
                pendingKey !== null
              }
              onClick={() =>
                runBulkAssign(
                  { targetVenueId, assignments: manualAssignments },
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
                manualAssignments.length === 0 ||
                pendingKey !== null
              }
              onClick={() =>
                runBulkAssign(
                  { targetVenueId, assignments: manualAssignments },
                  "manual:apply",
                )
              }
            >
              {pendingKey === "manual:apply"
                ? "Application…"
                : "Appliquer la fusion"}
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
              Ces lieux semblent identiques. Définissez le principal sur une
              carte — les autres seront fusionnés vers lui.
            </p>
            {similarGroups.map((group) => (
              <SimilarGroupRow
                key={group.key}
                group={group}
                pendingKey={pendingKey}
                onApply={(payload) =>
                  runBulkAssign(payload, `group:${group.key}`)
                }
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
            {locationConflicts.map((conflict) => (
              <LocationConflictRow
                key={conflict.locationKey}
                conflict={conflict}
                venues={venues}
                pendingKey={pendingKey}
                onApply={(payload) =>
                  runBulkAssign(payload, `location:${conflict.locationKey}`)
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
  onApply: (payload: BulkAssignPayload) => void;
}) {
  const [targetVenueId, setTargetVenueId] = useState("");
  const [permanentById, setPermanentById] = useState<Record<string, boolean>>(
    {},
  );

  const sourceIds = group.venues
    .map((venue) => venue.id)
    .filter((id) => id !== targetVenueId);

  const assignments = buildAssignments(sourceIds, targetVenueId, permanentById);

  return (
    <div className="flex flex-col gap-4 rounded-lg border p-4">
      <VenueMergeCardGrid>
        {group.venues.map((venue) => {
          const isPrimary = venue.id === targetVenueId;
          const isSource = Boolean(targetVenueId) && !isPrimary;

          return (
            <VenueMergeCard
              key={venue.id}
              venue={venue}
              isPrimary={isPrimary}
              isSource={isSource}
              permanent={permanentById[venue.id] ?? false}
              disabled={pendingKey !== null}
              onSetPrimary={() => setTargetVenueId(venue.id)}
              onTogglePermanent={() =>
                setPermanentById((current) => ({
                  ...current,
                  [venue.id]: !current[venue.id],
                }))
              }
            />
          );
        })}
      </VenueMergeCardGrid>
      <Button
        type="button"
        className="w-fit"
        disabled={!targetVenueId || assignments.length === 0 || pendingKey !== null}
        onClick={() =>
          onApply({
            targetVenueId,
            assignments,
            locationKeys: group.locationKeys,
          })
        }
      >
        {pendingKey === `group:${group.key}`
          ? "Fusion…"
          : "Fusionner le groupe"}
      </Button>
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
  onApply: (payload: BulkAssignPayload) => void;
}) {
  const [targetVenueId, setTargetVenueId] = useState("");
  const [permanentById, setPermanentById] = useState<Record<string, boolean>>(
    {},
  );

  const conflictVenues = conflict.variants
    .map((variant) =>
      variant.venueId
        ? venues.find((venue) => venue.id === variant.venueId)
        : null,
    )
    .filter(Boolean) as VenueWithStats[];

  const sourceIds = conflictVenues
    .map((venue) => venue.id)
    .filter((id) => id !== targetVenueId);

  const assignments = buildAssignments(sourceIds, targetVenueId, permanentById);

  const totalEvents = conflict.variants.reduce(
    (sum, variant) => sum + variant.eventCount,
    0,
  );

  return (
    <div className="flex flex-col gap-4 rounded-lg border p-4">
      <div>
        <p className="font-medium">{conflict.sampleLocationRaw}</p>
        <p className="text-muted-foreground text-xs">
          {totalEvents} événement{totalEvents > 1 ? "s" : ""}
        </p>
      </div>
      {conflictVenues.length > 0 ? (
        <VenueMergeCardGrid>
          {conflictVenues.map((venue) => {
            const isPrimary = venue.id === targetVenueId;
            const isSource = Boolean(targetVenueId) && !isPrimary;

            return (
              <VenueMergeCard
                key={venue.id}
                venue={venue}
                isPrimary={isPrimary}
                isSource={isSource}
                permanent={permanentById[venue.id] ?? false}
                disabled={pendingKey !== null}
                onSetPrimary={() => setTargetVenueId(venue.id)}
                onTogglePermanent={() =>
                  setPermanentById((current) => ({
                    ...current,
                    [venue.id]: !current[venue.id],
                  }))
                }
              />
            );
          })}
        </VenueMergeCardGrid>
      ) : null}
      <Button
        type="button"
        className="w-fit"
        disabled={!targetVenueId || pendingKey !== null}
        onClick={() =>
          onApply({
            targetVenueId,
            assignments,
            locationKey: conflict.locationKey,
          })
        }
      >
        {pendingKey === `location:${conflict.locationKey}`
          ? "Correction…"
          : "Corriger"}
      </Button>
    </div>
  );
}
