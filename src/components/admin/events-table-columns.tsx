"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown, Eye } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type {
  AdminEventSortColumn,
  AdminEventSortDir,
} from "@/lib/events/admin-events-params";
import type { AdminEventsTableColumnId } from "@/lib/events/admin-events-table-columns";
import type { AdminEventTableRow } from "@/lib/events/admin-events-table";
import { formatAdminEventTableDate } from "@/lib/events/format";
import { cn } from "@/lib/utils";

type SortableHeaderProps = {
  label: string;
  column: AdminEventSortColumn;
  sort: AdminEventSortColumn | null;
  dir: AdminEventSortDir;
  onSortToggle: (column: AdminEventSortColumn) => void;
};

function SortableHeader({
  label,
  column,
  sort,
  dir,
  onSortToggle,
}: SortableHeaderProps) {
  const isActive = sort === column;
  const Icon = isActive ? (dir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className="-ml-2 h-8 px-2 font-medium"
      onClick={() => onSortToggle(column)}
    >
      {label}
      <Icon className="size-3.5 text-muted-foreground" />
    </Button>
  );
}

function formatAdminEventDateCell(event: AdminEventTableRow) {
  const startAt = new Date(event.displayStartAt);

  if (event.recurrenceRule) {
    const { dateLine, timeLine } = formatAdminEventTableDate(
      startAt,
      null,
      event.isAllDay,
    );
    return { dateLine, timeLine };
  }

  return formatAdminEventTableDate(
    startAt,
    event.endAt ? new Date(event.endAt) : null,
    event.isAllDay,
  );
}

type CreateEventsTableColumnsOptions = {
  sort: AdminEventSortColumn | null;
  dir: AdminEventSortDir;
  onSortToggle: (column: AdminEventSortColumn) => void;
  visibleColumns: AdminEventsTableColumnId[];
};

export function createEventsTableColumns({
  sort,
  dir,
  onSortToggle,
  visibleColumns,
}: CreateEventsTableColumnsOptions): ColumnDef<AdminEventTableRow>[] {
  const visible = new Set(visibleColumns);

  const columns: ColumnDef<AdminEventTableRow>[] = [
    {
      id: "title",
      accessorKey: "title",
      header: () => (
        <SortableHeader
          label="Événement"
          column="title"
          sort={sort}
          dir={dir}
          onSortToggle={onSortToggle}
        />
      ),
      cell: ({ row }) => {
        const event = row.original;

        return (
          <div className="flex min-w-48 flex-col gap-0.5">
            <Link
              href={`/admin/events/${event.id}`}
              className="font-medium hover:underline"
            >
              {event.title}
            </Link>
            <span className="text-xs text-muted-foreground">
              {event.sourceName}
              {event.recurrenceRule ? " · récurrent" : ""}
            </span>
          </div>
        );
      },
    },
    {
      id: "date",
      header: () => (
        <SortableHeader
          label="Date"
          column="date"
          sort={sort}
          dir={dir}
          onSortToggle={onSortToggle}
        />
      ),
      cell: ({ row }) => {
        const { dateLine, timeLine } = formatAdminEventDateCell(row.original);

        return (
          <div className="flex min-w-28 flex-col gap-0.5 whitespace-normal">
            <span>{dateLine}</span>
            <span className="text-xs text-muted-foreground">{timeLine}</span>
          </div>
        );
      },
    },
    {
      id: "org",
      accessorKey: "organizationName",
      header: () => (
        <SortableHeader
          label="Organisateur"
          column="org"
          sort={sort}
          dir={dir}
          onSortToggle={onSortToggle}
        />
      ),
      cell: ({ row }) => (
        <span className="whitespace-normal">
          {row.original.organizationName ?? "—"}
        </span>
      ),
    },
    {
      id: "venue",
      header: () => (
        <SortableHeader
          label="Lieu"
          column="venue"
          sort={sort}
          dir={dir}
          onSortToggle={onSortToggle}
        />
      ),
      cell: ({ row }) => {
        const event = row.original;

        return (
          <div className="flex min-w-32 flex-col gap-1">
            <span className="whitespace-normal">{event.venueName ?? "—"}</span>
            {event.venueNeedsConfirmation ? (
              <Badge variant="outline" className="w-fit">
                Lieu non confirmé
              </Badge>
            ) : null}
          </div>
        );
      },
    },
    {
      id: "categories",
      header: "Catégories",
      cell: ({ row }) => (
        <span className="line-clamp-2 whitespace-normal">
          {row.original.categories?.length
            ? row.original.categories.join(", ")
            : "—"}
        </span>
      ),
    },
    {
      id: "status",
      header: () => (
        <SortableHeader
          label="État"
          column="state"
          sort={sort}
          dir={dir}
          onSortToggle={onSortToggle}
        />
      ),
      cell: ({ row }) => {
        const event = row.original;

        return (
          <div className="flex flex-wrap gap-1">
            {event.isConfirmed ? (
              <Badge variant="secondary">Confirmé</Badge>
            ) : (
              <Badge variant="outline">À confirmer</Badge>
            )}
            {event.hasMasterOverride ? (
              <Badge variant="outline">Modifié</Badge>
            ) : null}
            {event.status === "cancelled" ? (
              <Badge variant="destructive">Annulé</Badge>
            ) : null}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const event = row.original;

        return (
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="sm"
              nativeButton={false}
              render={
                <Link
                  href={`/evenement/${event.slug}`}
                  target="_blank"
                  rel="noreferrer"
                />
              }
            >
              <Eye data-icon="inline-start" />
              Voir
            </Button>
          </div>
        );
      },
    },
  ];

  return columns.filter((column) => visible.has(column.id as AdminEventsTableColumnId));
}

export function getEventsTableRowClassName(event: AdminEventTableRow) {
  return cn(!event.isUpcoming && "text-muted-foreground");
}
