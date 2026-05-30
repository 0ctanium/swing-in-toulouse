"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowLeftRight, Plus } from "lucide-react";
import { useQueryStates } from "nuqs";
import { useMemo, useState } from "react";

import { VenueConfirmDialog } from "@/components/admin/venue-confirm-dialog";
import { VenueFormDialog } from "@/components/admin/venue-form-dialog";
import { VenueReassignDialog } from "@/components/admin/venue-reassign-dialog";
import { VenueRedirectsPanel } from "@/components/admin/venue-redirects-panel";
import { VenuesTableFilters } from "@/components/admin/venues-table-filters";
import { createVenuesTableColumns } from "@/components/admin/venues-table-columns";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { adminVenuesClientParsers } from "@/lib/venues/admin-venues-params";
import { isVenueAddressConfirmed } from "@/lib/venues/confirmation";
import type { AdminVenueRow } from "@/lib/venues/admin-venue-row";
import type { VenueRedirectEntry } from "@/lib/venues/canonical";
import type { VenueWithStats } from "@/lib/venues/matching";

type VenuesAdminProps = {
  venues: AdminVenueRow[];
  allVenues: VenueWithStats[];
  venueRedirects: VenueRedirectEntry[];
  pendingConfirmationCount: number;
  googleConfigured: boolean;
};

function filterAndSortVenues(
  venues: AdminVenueRow[],
  confirmation: string | null,
) {
  let list = venues;

  if (confirmation === "pending") {
    list = list.filter((venue) => venue.needsConfirmation);
    return [...list].sort((a, b) => b.eventCount - a.eventCount);
  }

  if (confirmation === "confirmed") {
    list = list.filter((venue) => isVenueAddressConfirmed(venue));
  }

  return list;
}

export function VenuesAdmin({
  venues,
  allVenues,
  venueRedirects,
  pendingConfirmationCount,
  googleConfigured,
}: VenuesAdminProps) {
  const [query] = useQueryStates(adminVenuesClientParsers, {
    history: "replace",
    shallow: false,
  });

  const [formOpen, setFormOpen] = useState(false);
  const [reassignOpen, setReassignOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [editingVenue, setEditingVenue] = useState<AdminVenueRow | null>(null);
  const [confirmingVenue, setConfirmingVenue] = useState<AdminVenueRow | null>(
    null,
  );

  const filteredVenues = useMemo(
    () => filterAndSortVenues(venues, query.confirmation),
    [venues, query.confirmation],
  );

  const columns = useMemo(
    () =>
      createVenuesTableColumns({
        onEdit: (venue) => {
          setEditingVenue(venue);
          setFormOpen(true);
        },
        onConfirm: (venue) => {
          setConfirmingVenue(venue);
          setConfirmOpen(true);
        },
        googleConfigured,
      }),
    [googleConfigured],
  );

  const table = useReactTable({
    data: filteredVenues,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId: (row) => row.id,
  });

  const emptyMessage =
    query.confirmation === "pending"
      ? "Aucun lieu actif à confirmer."
      : query.confirmation === "confirmed"
        ? "Aucun lieu avec adresse Google confirmée."
        : "Aucun lieu principal enregistré.";

  function openCreateDialog() {
    setEditingVenue(null);
    setFormOpen(true);
  }

  return (
    <>
      <VenuesTableFilters />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          {filteredVenues.length} lieu{filteredVenues.length > 1 ? "x" : ""}
          {query.confirmation ? " (filtré)" : " principal"}
          {filteredVenues.length > 1 && !query.confirmation ? "aux" : ""}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={() => setReassignOpen(true)}>
            <ArrowLeftRight data-icon="inline-start" />
            Réassigner des événements
          </Button>
          <Button type="button" onClick={openCreateDialog}>
            <Plus data-icon="inline-start" />
            Nouveau lieu
          </Button>
        </div>
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
                  {query.confirmation
                    ? emptyMessage
                    : "Aucun lieu principal. Créez-en un pour commencer."}
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

      <VenueRedirectsPanel redirects={venueRedirects} />

      <VenueFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        venue={editingVenue}
      />

      <VenueConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        venue={confirmingVenue}
      />

      <VenueReassignDialog
        open={reassignOpen}
        onOpenChange={setReassignOpen}
        venues={allVenues}
      />
    </>
  );
}
