"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Eye, MapPin, Pencil } from "lucide-react";
import Link from "next/link";

import { VenueAliasBadge } from "@/components/admin/venue-alias-badge";
import { VenueIcalQualityBadge } from "@/components/admin/venue-ical-quality-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatVenueCategory } from "@/lib/venues/categories";
import { isVenueAddressConfirmed } from "@/lib/venues/confirmation";
import type { AdminVenueRow } from "@/lib/venues/admin-venue-row";

type CreateVenuesTableColumnsOptions = {
  onEdit: (venue: AdminVenueRow) => void;
  onConfirm: (venue: AdminVenueRow) => void;
  googleConfigured: boolean;
};

function venueAddressLine(venue: AdminVenueRow) {
  if (venue.formattedAddress) {
    return venue.formattedAddress;
  }

  if (venue.address) {
    return `${venue.address}, ${venue.city}`;
  }

  return venue.city;
}

export function createVenuesTableColumns({
  onEdit,
  onConfirm,
  googleConfigured,
}: CreateVenuesTableColumnsOptions): ColumnDef<AdminVenueRow>[] {
  return [
    {
      accessorKey: "name",
      header: "Lieu",
      cell: ({ row }) => {
        const venue = row.original;

        return (
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{venue.name}</span>
              <VenueAliasBadge venue={venue} />
            </div>
            <span className="text-muted-foreground text-xs">
              /lieu/{venue.slug}
            </span>
            {venue.iCalIssues.length > 0 ? (
              <VenueIcalQualityBadge issues={venue.iCalIssues} />
            ) : null}
          </div>
        );
      },
    },
    {
      id: "address",
      header: "Adresse",
      cell: ({ row }) => (
        <span className="line-clamp-2 text-sm whitespace-normal">
          {venueAddressLine(row.original)}
        </span>
      ),
    },
    {
      accessorKey: "category",
      header: "Catégorie",
      cell: ({ row }) => {
        const label = formatVenueCategory(row.original.category);

        return label ? (
          <Badge variant="secondary">{label}</Badge>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        );
      },
    },
    {
      id: "events",
      header: "Événements",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {row.original.eventCount}
          {row.original.overrideCount > 0
            ? ` · ${row.original.overrideCount} override${row.original.overrideCount > 1 ? "s" : ""}`
            : ""}
        </span>
      ),
    },
    {
      id: "confirmation",
      header: "Adresse Google",
      cell: ({ row }) => {
        const venue = row.original;
        const confirmed = isVenueAddressConfirmed(venue);

        if (!googleConfigured) {
          return (
            <span className="text-muted-foreground text-sm">
              API non configurée
            </span>
          );
        }

        return confirmed ? (
          <Badge variant="outline">Confirmée</Badge>
        ) : (
          <Badge variant="secondary">À confirmer</Badge>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const venue = row.original;

        return (
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="sm"
              nativeButton={false}
              render={
                <Link
                  href={`/lieu/${venue.slug}`}
                  target="_blank"
                  rel="noreferrer"
                />
              }
            >
              <Eye data-icon="inline-start" />
              Voir
            </Button>
            {googleConfigured ? (
              <Button
                type="button"
                variant={venue.needsConfirmation ? "outline" : "ghost"}
                size="sm"
                onClick={() => onConfirm(venue)}
              >
                <MapPin data-icon="inline-start" />
                {venue.needsConfirmation ? "Confirmer" : "Adresse Google"}
              </Button>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onEdit(venue)}
            >
              <Pencil data-icon="inline-start" />
              Modifier
            </Button>
          </div>
        );
      },
    },
  ];
}
