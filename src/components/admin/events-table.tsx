"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useQueryStates } from "nuqs";
import { useCallback, useMemo } from "react";

import {
  createEventsTableColumns,
  getEventsTableRowClassName,
} from "@/components/admin/events-table-columns";
import { EventsTableFilters } from "@/components/admin/events-table-filters";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  adminEventsClientParsers,
  type AdminEventSortColumn,
} from "@/lib/events/admin-events-params";
import type {
  AdminEventsFilterOptions,
  AdminEventsTableResult,
} from "@/lib/events/admin-events-table";

type EventsTableProps = {
  data: AdminEventsTableResult;
  filterOptions: AdminEventsFilterOptions;
};

export function EventsTable({ data, filterOptions }: EventsTableProps) {
  const { rows, page, total, totalPages, query } = data;
  const from = total === 0 ? 0 : (page - 1) * data.pageSize + 1;
  const to = Math.min(page * data.pageSize, total);

  const [, setQuery] = useQueryStates(adminEventsClientParsers, {
    history: "replace",
    shallow: false,
  });

  const handleSortToggle = useCallback(
    (column: AdminEventSortColumn) => {
      if (query.sort !== column) {
        void setQuery({ sort: column, dir: "asc", page: 1 });
        return;
      }

      if (query.dir === "asc") {
        void setQuery({ dir: "desc", page: 1 });
        return;
      }

      void setQuery({ sort: null, dir: null, page: 1 });
    },
    [query.sort, query.dir, setQuery],
  );

  const columns = useMemo(
    () =>
      createEventsTableColumns({
        sort: query.sort,
        dir: query.dir,
        onSortToggle: handleSortToggle,
      }),
    [query.sort, query.dir, handleSortToggle],
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
  });

  return (
    <div className="flex flex-col gap-4">
      <EventsTableFilters
        query={query}
        options={filterOptions}
        onQueryChange={(next) => void setQuery(next)}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
        <p>
          {total === 0
            ? "Aucun événement."
            : `${from}–${to} sur ${total} événement${total > 1 ? "s" : ""}`}
        </p>
        {totalPages > 1 ? (
          <p>
            Page {page} / {totalPages}
          </p>
        ) : null}
      </div>

      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={getEventsTableRowClassName(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="align-top whitespace-normal"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  Aucun événement ne correspond aux filtres sélectionnés.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => void setQuery({ page: page - 1 })}
          >
            Page précédente
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => void setQuery({ page: page + 1 })}
          >
            Page suivante
          </Button>
        </div>
      ) : null}
    </div>
  );
}
