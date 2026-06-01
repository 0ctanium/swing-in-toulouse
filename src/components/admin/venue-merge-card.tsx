"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { VenueAliasBadge } from "@/components/admin/venue-alias-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { isVenueAddressConfirmed } from "@/lib/venues/confirmation";
import type { VenueWithStats } from "@/lib/venues/matching";
import { cn } from "@/lib/utils";

function venueAddressLine(venue: VenueWithStats) {
  if (venue.formattedAddress) {
    return venue.formattedAddress;
  }

  if (venue.address) {
    return venue.address;
  }

  return "Adresse iCal incomplète";
}

type VenueMergeCardProps = {
  venue: VenueWithStats;
  isPrimary: boolean;
  isSource: boolean;
  permanent: boolean;
  onSetPrimary: () => void;
  onTogglePermanent: () => void;
  onToggleSource?: () => void;
  showSourceToggle?: boolean;
  disabled?: boolean;
};

export function VenueMergeCard({
  venue,
  isPrimary,
  isSource,
  permanent,
  onSetPrimary,
  onTogglePermanent,
  onToggleSource,
  showSourceToggle = false,
  disabled = false,
}: VenueMergeCardProps) {
  const confirmed = isVenueAddressConfirmed(venue);
  const isExistingAlias = Boolean(venue.canonicalVenueId);

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-lg border p-3",
        isPrimary && "border-primary bg-primary/5 ring-1 ring-primary/20",
      )}
    >
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {isPrimary ? (
            <Badge>Lieu principal</Badge>
          ) : null}
          <VenueAliasBadge venue={venue} />
        </div>
        <p className="font-medium">{venue.name}</p>
        <p className="text-muted-foreground text-xs">
          {venue.eventCount} événement{venue.eventCount > 1 ? "s" : ""} ·{" "}
          {confirmed ? "Google confirmé" : "Non confirmé"}
        </p>
        <p className="text-muted-foreground text-xs">{venueAddressLine(venue)}</p>
        <Link
          href={`/lieu/${venue.slug}`}
          className="text-muted-foreground w-fit text-xs hover:underline"
        >
          /lieu/{venue.slug}
        </Link>
      </div>

      <div className="flex flex-col gap-2">
        {!isPrimary && !isExistingAlias ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit"
            disabled={disabled}
            onClick={onSetPrimary}
          >
            Définir comme principal
          </Button>
        ) : null}

        {showSourceToggle && !isPrimary && !isExistingAlias ? (
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={isSource}
              disabled={disabled}
              onChange={onToggleSource}
            />
            Fusionner vers le principal
          </label>
        ) : null}

        {isSource && !isPrimary ? (
          <label className="flex items-center gap-2 text-xs">
            <input
              type="checkbox"
              checked={permanent}
              disabled={disabled}
              onChange={onTogglePermanent}
            />
            Alias permanent (décocher pour ne réassigner que les événements)
          </label>
        ) : null}
      </div>
    </div>
  );
}

export function VenueMergeCardGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">{children}</div>
  );
}
