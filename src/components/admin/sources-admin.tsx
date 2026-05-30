"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";

import { SourceDeleteDialog } from "@/components/admin/source-delete-dialog";
import { SourceFormDialog } from "@/components/admin/source-form-dialog";
import type { OrganizationSelectOption } from "@/components/admin/organization-select";
import { createSourcesTableColumns } from "@/components/admin/sources-table-columns";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AdminSourceRow } from "@/lib/sources/admin";
import type { VenueSelectOption } from "@/lib/venues/select-options";

type SourcesAdminProps = {
  sources: AdminSourceRow[];
  organizations: OrganizationSelectOption[];
  venues: VenueSelectOption[];
};

export function SourcesAdmin({
  sources,
  organizations,
  venues,
}: SourcesAdminProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<AdminSourceRow | null>(
    null,
  );
  const [deletingSource, setDeletingSource] = useState<AdminSourceRow | null>(
    null,
  );

  const columns = useMemo(
    () =>
      createSourcesTableColumns({
        onEdit: (source) => {
          setEditingSource(source);
          setFormOpen(true);
        },
        onDelete: setDeletingSource,
      }),
    [],
  );

  const table = useReactTable({
    data: sources,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
  });

  function openCreateDialog() {
    setEditingSource(null);
    setFormOpen(true);
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          {sources.length} source{sources.length > 1 ? "s" : ""}
        </p>
        <Button type="button" onClick={openCreateDialog}>
          <Plus data-icon="inline-start" />
          Nouvelle source
        </Button>
      </div>

      <div className="rounded-lg border">
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
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  Aucune source. Créez-en une pour commencer.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <SourceFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        source={editingSource}
        organizations={organizations}
        venues={venues}
      />

      <SourceDeleteDialog
        source={deletingSource}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingSource(null);
          }
        }}
      />
    </>
  );
}
