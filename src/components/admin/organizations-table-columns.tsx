"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Eye, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatOrganizationCategory } from "@/lib/organizations/categories";
import type { AdminOrganizationRow } from "@/lib/organizations/admin";
import { organizationUrl } from "@/lib/site";

type CreateOrganizationsTableColumnsOptions = {
  onEdit: (organization: AdminOrganizationRow) => void;
  onDelete: (organization: AdminOrganizationRow) => void;
};

export function createOrganizationsTableColumns({
  onEdit,
  onDelete,
}: CreateOrganizationsTableColumnsOptions): ColumnDef<AdminOrganizationRow>[] {
  return [
    {
      accessorKey: "name",
      header: "Nom",
      cell: ({ row }) => {
        const organization = row.original;

        return (
          <div className="flex min-w-0 flex-col gap-0.5">
            <Link
              href={organizationUrl(organization.slug)}
              className="font-medium hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              {organization.name}
            </Link>
            <span className="text-muted-foreground text-xs">
              /organisateur/{organization.slug}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "category",
      header: "Catégorie",
      cell: ({ row }) => {
        const label = formatOrganizationCategory(row.original.category);

        return label ? (
          <Badge variant="secondary">{label}</Badge>
        ) : (
          <span className="text-muted-foreground text-sm">—</span>
        );
      },
    },
    {
      id: "location",
      header: "Lieu",
      cell: ({ row }) => {
        const organization = row.original;

        if (organization.venueName && organization.venueSlug) {
          return (
            <div className="flex min-w-0 flex-col gap-0.5 text-sm">
              <span>{organization.venueName}</span>
              <span className="text-muted-foreground text-xs">
                /lieu/{organization.venueSlug}
              </span>
            </div>
          );
        }

        return (
          <span className="text-muted-foreground text-sm">Lieu non lié</span>
        );
      },
    },
    {
      accessorKey: "website",
      header: "Site web",
      cell: ({ row }) => {
        const website = row.original.website;

        if (!website) {
          return <span className="text-muted-foreground text-sm">—</span>;
        }

        return (
          <a
            href={website}
            target="_blank"
            rel="noreferrer"
            className="line-clamp-1 text-sm hover:underline"
          >
            {website.replace(/^https?:\/\//, "")}
          </a>
        );
      },
    },
    {
      id: "usage",
      header: "Usage",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {row.original.sourceCount} source
          {row.original.sourceCount > 1 ? "s" : ""}
          {" · "}
          {row.original.eventCount} événement
          {row.original.eventCount > 1 ? "s" : ""}
        </span>
      ),
    },
    {
      accessorKey: "isActive",
      header: "Statut",
      cell: ({ row }) =>
        row.original.isActive ? (
          <Badge variant="outline">Actif</Badge>
        ) : (
          <Badge variant="secondary">Inactif</Badge>
        ),
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const organization = row.original;

        return (
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="sm"
              render={
                <Link
                  href={`/organisateur/${organization.slug}`}
                  target="_blank"
                  rel="noreferrer"
                />
              }
            >
              <Eye data-icon="inline-start" />
              Voir
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onEdit(organization)}
            >
              <Pencil data-icon="inline-start" />
              Modifier
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => onDelete(organization)}
            >
              <Trash2 data-icon="inline-start" />
              Supprimer
            </Button>
          </div>
        );
      },
    },
  ];
}
