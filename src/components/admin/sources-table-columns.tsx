"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Eye, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AdminSourceRow } from "@/lib/sources/admin";

type CreateSourcesTableColumnsOptions = {
  onEdit: (source: AdminSourceRow) => void;
  onDelete: (source: AdminSourceRow) => void;
};

export function createSourcesTableColumns({
  onEdit,
  onDelete,
}: CreateSourcesTableColumnsOptions): ColumnDef<AdminSourceRow>[] {
  return [
    {
      accessorKey: "name",
      header: "Source",
      cell: ({ row }) => {
        const source = row.original;

        return (
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="font-medium">{source.name}</span>
            <span className="text-muted-foreground text-xs">/{source.slug}</span>
            <a
              href={source.url}
              target="_blank"
              rel="noreferrer"
              className="line-clamp-1 text-xs hover:underline"
            >
              {source.url}
            </a>
          </div>
        );
      },
    },
    {
      id: "organization",
      header: "Organisateur",
      cell: ({ row }) => {
        const source = row.original;

        if (source.organizationName && source.organizationSlug) {
          return (
            <div className="flex min-w-0 flex-col gap-0.5 text-sm">
              <span>{source.organizationName}</span>
              <span className="text-muted-foreground text-xs">
                /organisateur/{source.organizationSlug}
              </span>
            </div>
          );
        }

        return <span className="text-muted-foreground text-sm">—</span>;
      },
    },
    {
      id: "defaults",
      header: "Défauts iCal",
      cell: ({ row }) => {
        const source = row.original;
        const categories = source.defaultCategories ?? [];

        return (
          <div className="flex min-w-0 flex-col gap-0.5 text-sm">
            {source.defaultLocationRaw ? (
              <span className="line-clamp-2">{source.defaultLocationRaw}</span>
            ) : (
              <span className="text-muted-foreground">Pas de lieu par défaut</span>
            )}
            {categories.length > 0 ? (
              <span className="text-muted-foreground text-xs">
                {categories.join(", ")}
              </span>
            ) : null}
          </div>
        );
      },
    },
    {
      id: "events",
      header: "Événements",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm">
          {row.original.eventCount}
        </span>
      ),
    },
    {
      accessorKey: "isActive",
      header: "Statut",
      cell: ({ row }) =>
        row.original.isActive ? (
          <Badge variant="outline">Active</Badge>
        ) : (
          <Badge variant="secondary">Inactive</Badge>
        ),
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const source = row.original;

        return (
          <div className="flex justify-end gap-1">
            {source.organizationSlug ? (
              <Button
                variant="ghost"
                size="sm"
                render={
                  <Link
                    href={`/organisateur/${source.organizationSlug}`}
                    target="_blank"
                    rel="noreferrer"
                  />
                }
              >
                <Eye data-icon="inline-start" />
                Voir
              </Button>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onEdit(source)}
            >
              <Pencil data-icon="inline-start" />
              Modifier
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => onDelete(source)}
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
