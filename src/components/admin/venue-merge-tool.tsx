"use client";

import { useState } from "react";
import { toast } from "sonner";

import {
  VenueMergeCard,
  VenueMergeCardGrid,
} from "@/components/admin/venue-merge-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  useBulkAssignVenues,
  useDismissVenueMergeGroup,
  type BulkAssignPayload,
} from "@/lib/admin/use-venues";
import {
  buildVenueAssignments,
  isPermanentVenueAlias,
  togglePermanentVenueAlias,
} from "@/lib/venues/assignments";
import type {
  LocationVenueConflict,
  SimilarVenueGroup,
  VenueWithStats,
} from "@/lib/venues/matching";

type VenueMergeToolProps = {
  venues: VenueWithStats[];
  similarGroups: SimilarVenueGroup[];
  locationConflicts: LocationVenueConflict[];
};

export function VenueMergeTool({
  venues,
  similarGroups,
  locationConflicts,
}: VenueMergeToolProps) {
  const bulkAssign = useBulkAssignVenues();
  const dismissMergeGroup = useDismissVenueMergeGroup();
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  async function runBulkAssign(
    payload: BulkAssignPayload,
    pendingId: string,
  ) {
    setPendingKey(pendingId);

    try {
      const data = await bulkAssign.mutateAsync({ payload });

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
    } catch (assignError) {
      toast.error(
        assignError instanceof Error
          ? assignError.message
          : "Fusion impossible.",
      );
    } finally {
      setPendingKey(null);
    }
  }

  async function runDismissGroup(venueIds: string[], pendingId: string) {
    setPendingKey(pendingId);

    try {
      const data = await dismissMergeGroup.mutateAsync(venueIds);
      toast.success(
        data.dismissed > 0
          ? "Ces lieux ne seront plus proposés à la fusion."
          : "Déjà marqués comme distincts.",
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Enregistrement impossible.",
      );
    } finally {
      setPendingKey(null);
    }
  }

  if (similarGroups.length === 0 && locationConflicts.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        Aucune fusion suggérée pour le moment.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
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
                onDismiss={runDismissGroup}
              />
            ))}
          </CardContent>
        </Card>
      ) : null}

      {locationConflicts.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Même libellé iCal, lieux différents
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-muted-foreground text-sm">
              Des événements partagent le même texte{" "}
              <span className="font-medium">LOCATION</span> importé (avant la
              première virgule), mais sont rattachés à plusieurs fiches lieu.
              Typiquement : variantes de nom à la sync qui ont créé plusieurs
              fiches principales pour le même libellé. Les alias déjà en place
              sont ignorés (leurs événements sont rattachés au lieu principal).
              Choisissez le principal : réassignation des événements encore
              liés à une autre fiche, avec alias permanent par défaut. Complète
              « Lieux similaires », qui compare les fiches entre elles.
            </p>
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
  onDismiss,
}: {
  group: SimilarVenueGroup;
  pendingKey: string | null;
  onApply: (payload: BulkAssignPayload) => void;
  onDismiss: (venueIds: string[], pendingId: string) => void;
}) {
  const [targetVenueId, setTargetVenueId] = useState("");
  const [permanentById, setPermanentById] = useState<Record<string, boolean>>(
    {},
  );

  const sourceIds = group.venues
    .map((venue) => venue.id)
    .filter((id) => id !== targetVenueId);

  const assignments = buildVenueAssignments(
    sourceIds,
    targetVenueId,
    permanentById,
  );

  return (
    <div className="flex flex-col gap-4 rounded-lg border p-4">
      {group.pairMatches.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
            Pourquoi ce groupe ?
          </p>
          <ul className="text-muted-foreground flex flex-col gap-1 text-xs">
            {group.pairMatches.map((match) => (
              <li key={`${match.venueIdA}:${match.venueIdB}`}>
                {match.reasonLabel}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
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
              permanent={isPermanentVenueAlias(permanentById, venue.id)}
              disabled={pendingKey !== null}
              onSetPrimary={() => setTargetVenueId(venue.id)}
              onTogglePermanent={() =>
                setPermanentById((current) =>
                  togglePermanentVenueAlias(current, venue.id),
                )
              }
            />
          );
        })}
      </VenueMergeCardGrid>
      <div className="flex flex-wrap gap-2">
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
        <Button
          type="button"
          variant="outline"
          className="w-fit"
          disabled={pendingKey !== null}
          onClick={() =>
            onDismiss(
              group.venues.map((venue) => venue.id),
              `dismiss:${group.key}`,
            )
          }
        >
          {pendingKey === `dismiss:${group.key}`
            ? "Enregistrement…"
            : "Lieux distincts"}
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

  const assignments = buildVenueAssignments(
    sourceIds,
    targetVenueId,
    permanentById,
  );

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
                permanent={isPermanentVenueAlias(permanentById, venue.id)}
                disabled={pendingKey !== null}
                onSetPrimary={() => setTargetVenueId(venue.id)}
                onTogglePermanent={() =>
                  setPermanentById((current) =>
                    togglePermanentVenueAlias(current, venue.id),
                  )
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
