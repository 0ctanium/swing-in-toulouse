"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Plus } from "lucide-react";
import { useMemo, useState } from "react";

import { OrganizationDeleteDialog } from "@/components/admin/organization-delete-dialog";
import { OrganizationFormDialog } from "@/components/admin/organization-form-dialog";
import { createOrganizationsTableColumns } from "@/components/admin/organizations-table-columns";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { AdminOrganizationRow } from "@/lib/organizations/admin";
import type { VenueSelectOption } from "@/lib/venues/select-options";

type OrganizationsAdminProps = {
  organizations: AdminOrganizationRow[];
  venues: VenueSelectOption[];
};

export function OrganizationsAdmin({
  organizations,
  venues,
}: OrganizationsAdminProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingOrganization, setEditingOrganization] =
    useState<AdminOrganizationRow | null>(null);
  const [deletingOrganization, setDeletingOrganization] =
    useState<AdminOrganizationRow | null>(null);

  const columns = useMemo(
    () =>
      createOrganizationsTableColumns({
        onEdit: (organization) => {
          setEditingOrganization(organization);
          setFormOpen(true);
        },
        onDelete: setDeletingOrganization,
      }),
    [],
  );

  const table = useReactTable({
    data: organizations,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
  });

  function openCreateDialog() {
    setEditingOrganization(null);
    setFormOpen(true);
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          {organizations.length} organisateur
          {organizations.length > 1 ? "s" : ""}
        </p>
        <Button type="button" onClick={openCreateDialog}>
          <Plus data-icon="inline-start" />
          Nouvel organisateur
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
                  Aucun organisateur. Créez-en un pour commencer.
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

      <OrganizationFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        organization={editingOrganization}
        venues={venues}
      />

      <OrganizationDeleteDialog
        organization={deletingOrganization}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingOrganization(null);
          }
        }}
      />
    </>
  );
}
