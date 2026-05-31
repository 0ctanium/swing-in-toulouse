"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Eye, Pencil, RefreshCw, Trash2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatSourceSyncMessage } from "@/lib/admin/use-sources";
import type { AdminSourceRow } from "@/lib/sources/admin";

type CreateSourcesTableColumnsOptions = {
  onEdit: (source: AdminSourceRow) => void;
  onDelete: (source: AdminSourceRow) => void;
  onSync: (source: AdminSourceRow) => Promise<void>;
  syncingSourceId: string | null;
};

function formatFileSize(bytes: number | null) {
  if (bytes === null) {
    return null;
  }

  if (bytes < 1024) {
    return `${bytes} o`;
  }

  return `${(bytes / 1024).toFixed(1)} Ko`;
}

export function createSourcesTableColumns({
  onEdit,
  onDelete,
  onSync,
  syncingSourceId,
}: CreateSourcesTableColumnsOptions): ColumnDef<AdminSourceRow>[] {
  return [
    {
      accessorKey: "name",
      header: "Source",
      cell: ({ row }) => {
        const source = row.original;

        return (
          <div className="flex min-w-0 flex-col gap-0.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{source.name}</span>
              <Badge variant="outline">
                {source.type === "ical-file" ? "Fichier" : "URL"}
              </Badge>
            </div>
            <span className="text-muted-foreground text-xs">
              /{source.slug}
            </span>
            {source.type === "ical" && source.url ? (
              <a
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="line-clamp-1 text-xs hover:underline"
              >
                {source.url}
              </a>
            ) : source.icalFileName ? (
              <span className="text-muted-foreground line-clamp-1 text-xs">
                {source.icalFileName}
                {formatFileSize(source.icalFileSize)
                  ? ` (${formatFileSize(source.icalFileSize)})`
                  : null}
              </span>
            ) : null}
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
              <span className="text-muted-foreground">
                Pas de lieu par défaut
              </span>
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
        const syncing = syncingSourceId === source.id;

        return (
          <div className="flex justify-end gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={syncing}
              onClick={() => {
                void onSync(source).catch((error) => {
                  toast.error(
                    error instanceof Error
                      ? error.message
                      : "Synchronisation impossible.",
                  );
                });
              }}
            >
              <RefreshCw
                data-icon="inline-start"
                className={syncing ? "animate-spin" : undefined}
              />
              {syncing ? "Sync…" : "Sync"}
            </Button>
            {source.organizationSlug ? (
              <Button
                variant="ghost"
                size="sm"
                nativeButton={false}
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
