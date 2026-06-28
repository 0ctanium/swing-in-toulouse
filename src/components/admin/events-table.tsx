"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useQueryStates } from "nuqs";
import { useCallback, useEffect, useMemo, useState } from "react";

import { EventsTableColumnPicker } from "@/components/admin/events-table-column-picker";
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
import {
  DEFAULT_ADMIN_EVENTS_VISIBLE_COLUMNS,
  readAdminEventsVisibleColumns,
  writeAdminEventsVisibleColumns,
  type AdminEventsTableColumnId,
} from "@/lib/events/admin-events-table-columns";

type EventsTableProps = {
  data: AdminEventsTableResult;
  filterOptions: AdminEventsFilterOptions;
};

function EventsTablePagination({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Button
        variant="outline"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        Page précédente
      </Button>
      <p className="text-sm text-muted-foreground">
        Page {page} / {totalPages}
      </p>
      <Button
        variant="outline"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        Page suivante
      </Button>
    </div>
  );
}

export function EventsTable({ data, filterOptions }: EventsTableProps) {
  const { rows, page, total, totalPages, query } = data;
  const from = total === 0 ? 0 : (page - 1) * data.pageSize + 1;
  const to = Math.min(page * data.pageSize, total);

  const [, setQuery] = useQueryStates(adminEventsClientParsers, {
    history: "replace",
    shallow: false,
  });

  const [visibleColumns, setVisibleColumns] = useState<
    AdminEventsTableColumnId[]
  >(DEFAULT_ADMIN_EVENTS_VISIBLE_COLUMNS);

  useEffect(() => {
    setVisibleColumns(readAdminEventsVisibleColumns());
  }, []);

  const handleVisibleColumnsChange = useCallback(
    (columns: AdminEventsTableColumnId[]) => {
      setVisibleColumns(columns);
      writeAdminEventsVisibleColumns(columns);
    },
    [],
  );

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
        visibleColumns,
      }),
    [query.sort, query.dir, handleSortToggle, visibleColumns],
  );

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
  });

  const summary =
    total === 0
      ? "Aucun événement."
      : `${from}–${to} sur ${total} événement${total > 1 ? "s" : ""}`;

  function handlePageChange(nextPage: number) {
    void setQuery({ page: nextPage });
  }

  return (
    <div className="flex flex-col gap-4">
      <EventsTableFilters
        query={query}
        options={filterOptions}
        onQueryChange={(next) => void setQuery(next)}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{summary}</p>
        <EventsTableColumnPicker
          visibleColumns={visibleColumns}
          onChange={handleVisibleColumnsChange}
        />
      </div>

      <EventsTablePagination
        page={page}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />

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

      <EventsTablePagination
        page={page}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  );
}
