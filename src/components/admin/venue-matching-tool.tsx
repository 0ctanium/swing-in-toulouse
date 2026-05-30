"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { VenueAliasBadge } from "@/components/admin/venue-picker";
import {
  VenueMergeCard,
  VenueMergeCardGrid,
} from "@/components/admin/venue-merge-card";
import { VenueRedirectsPanel } from "@/components/admin/venue-redirects-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useBulkAssignVenues,
  type BulkAssignPayload,
} from "@/lib/admin/use-venues";
import { isVenueAddressConfirmed } from "@/lib/venues/confirmation";
import type { VenueRedirectEntry } from "@/lib/venues/canonical";
import type {
  LocationVenueConflict,
  SimilarVenueGroup,
  VenueAssignment,
  VenueWithStats,
} from "@/lib/venues/matching";
import { cn } from "@/lib/utils";

type VenueMatchingToolProps = {
  venues: VenueWithStats[];
  similarGroups: SimilarVenueGroup[];
  locationConflicts: LocationVenueConflict[];
  venueRedirects: VenueRedirectEntry[];
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
  const bulkAssign = useBulkAssignVenues();
  const [search, setSearch] = useState("");
  const [targetVenueId, setTargetVenueId] = useState("");
  const [selectedSourceVenueIds, setSelectedSourceVenueIds] = useState<
    string[]
  >([]);
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
      const data = await bulkAssign.mutateAsync({ payload, dryRun });

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
            <CardTitle className="text-lg">
              LOCATION iCal incohérentes
            </CardTitle>
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

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Réassignation manuelle</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-muted-foreground text-sm">
            Cochez les lieux à fusionner, définissez le principal sur une ligne,
            puis appliquez.
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

          <div className="max-h-80 overflow-y-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="sticky top-0 border-b bg-background text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Fusionner</th>
                  <th className="px-3 py-2 text-left font-medium">Lieu</th>
                  <th className="px-3 py-2 text-left font-medium">Principal</th>
                  <th className="px-3 py-2 text-left font-medium">Alias</th>
                  <th className="px-3 py-2 text-right font-medium" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredVenues.map((venue) => {
                  const isPrimary = venue.id === targetVenueId;
                  const isSource = manualSourceIds.includes(venue.id);
                  const confirmed = isVenueAddressConfirmed(venue);

                  return (
                    <tr
                      key={venue.id}
                      className={cn(isPrimary && "bg-primary/5")}
                    >
                      <td className="px-3 py-2 align-top">
                        <input
                          type="checkbox"
                          checked={isSource}
                          disabled={isPrimary || pendingKey !== null}
                          onChange={() => toggleSourceVenue(venue.id)}
                        />
                      </td>
                      <td className="px-3 py-2 align-top">
                        <div className="flex min-w-0 flex-col gap-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-medium">{venue.name}</span>
                            <VenueAliasBadge venue={venue} />
                          </div>
                          <span className="text-muted-foreground text-xs">
                            {venue.eventCount} événement
                            {venue.eventCount > 1 ? "s" : ""} ·{" "}
                            {confirmed ? "Google confirmé" : "Non confirmé"}
                            {venue.address ? ` · ${venue.address}` : ""}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2 align-top">
                        {isPrimary ? (
                          <Badge>Lieu principal</Badge>
                        ) : (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={pendingKey !== null}
                            onClick={() => setPrimary(venue.id)}
                          >
                            Définir principal
                          </Button>
                        )}
                      </td>
                      <td className="px-3 py-2 align-top">
                        {isSource && !isPrimary ? (
                          <label className="flex items-center gap-2 text-xs">
                            <input
                              type="checkbox"
                              checked={permanentBySourceId[venue.id] ?? false}
                              disabled={pendingKey !== null}
                              onChange={() => togglePermanent(venue.id)}
                            />
                            Permanent
                          </label>
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            —
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 align-top text-right">
                        <Link
                          href={`/lieu/${venue.slug}`}
                          className="text-muted-foreground text-xs hover:underline"
                        >
                          Voir
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

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
        disabled={
          !targetVenueId || assignments.length === 0 || pendingKey !== null
        }
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
