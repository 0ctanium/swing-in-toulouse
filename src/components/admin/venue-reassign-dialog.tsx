"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { VenueAliasBadge } from "@/components/admin/venue-alias-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  useBulkAssignVenues,
  type BulkAssignPayload,
} from "@/lib/admin/use-venues";
import { isVenueAddressConfirmed } from "@/lib/venues/confirmation";
import { buildVenueAssignments } from "@/lib/venues/assignments";
import type { VenueWithStats } from "@/lib/venues/matching";
import { cn } from "@/lib/utils";

type VenueReassignDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  venues: VenueWithStats[];
};

export function VenueReassignDialog({
  open,
  onOpenChange,
  venues,
}: VenueReassignDialogProps) {
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

  const eligibleVenues = useMemo(
    () => venues.filter((venue) => !venue.canonicalVenueId),
    [venues],
  );

  const filteredVenues = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return eligibleVenues;
    }

    return eligibleVenues.filter(
      (venue) =>
        venue.name.toLowerCase().includes(query) ||
        venue.slug.includes(query) ||
        venue.address?.toLowerCase().includes(query),
    );
  }, [eligibleVenues, search]);

  function resetForm() {
    setSearch("");
    setTargetVenueId("");
    setSelectedSourceVenueIds([]);
    setPermanentBySourceId({});
    setPreviewCount(null);
  }

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

      resetForm();
      onOpenChange(false);
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
  const manualAssignments = buildVenueAssignments(
    manualSourceIds,
    targetVenueId,
    permanentBySourceId,
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) {
          resetForm();
        }
      }}
    >
      <DialogContent className="flex max-h-[min(90vh,48rem)] flex-col gap-4 sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Réassignation manuelle</DialogTitle>
          <DialogDescription>
            Cochez les lieux à fusionner, définissez le principal, puis appliquez
            la correction sur les événements concernés.
          </DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
          <div className="flex flex-col gap-2">
            <Label htmlFor="venue-reassign-search">Rechercher un lieu</Label>
            <Input
              id="venue-reassign-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nom, slug ou adresse…"
              disabled={pendingKey !== null}
            />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto rounded-lg border">
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
                          target="_blank"
                          rel="noreferrer"
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
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          {previewCount !== null ? (
            <span className="text-muted-foreground text-sm">
              {previewCount} événement{previewCount > 1 ? "s" : ""} concerné
              {previewCount > 1 ? "s" : ""}
            </span>
          ) : (
            <span />
          )}
          <div className="flex flex-wrap gap-2">
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
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
