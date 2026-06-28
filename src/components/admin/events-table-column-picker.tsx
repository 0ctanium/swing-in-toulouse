"use client";

import { Columns3 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ADMIN_EVENTS_TABLE_COLUMNS,
  type AdminEventsTableColumnId,
} from "@/lib/events/admin-events-table-columns";

type EventsTableColumnPickerProps = {
  visibleColumns: AdminEventsTableColumnId[];
  onChange: (columns: AdminEventsTableColumnId[]) => void;
};

export function EventsTableColumnPicker({
  visibleColumns,
  onChange,
}: EventsTableColumnPickerProps) {
  function toggleColumn(columnId: AdminEventsTableColumnId) {
    const definition = ADMIN_EVENTS_TABLE_COLUMNS.find(
      (column) => column.id === columnId,
    );

    if (!definition?.hideable) {
      return;
    }

    if (visibleColumns.includes(columnId)) {
      onChange(visibleColumns.filter((id) => id !== columnId));
      return;
    }

    onChange([...visibleColumns, columnId]);
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button type="button" variant="outline" size="sm" className="h-8" />}
      >
        <Columns3 data-icon="inline-start" />
        Colonnes
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Colonnes visibles</DropdownMenuLabel>
          {ADMIN_EVENTS_TABLE_COLUMNS.filter((column) => column.hideable).map(
            (column) => (
              <DropdownMenuCheckboxItem
                key={column.id}
                checked={visibleColumns.includes(column.id)}
                onCheckedChange={() => toggleColumn(column.id)}
              >
                {column.label}
              </DropdownMenuCheckboxItem>
            ),
          )}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
