"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { ScheduleEventRow } from "@/components/events/schedule-event-row";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import type { EventOccurrence } from "@/lib/events/queries";

type CalendarDayDrawerProps = {
  day: Date | null;
  events: EventOccurrence[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function formatDayDrawerTitle(day: Date) {
  const label = format(day, "EEEE d MMMM yyyy", { locale: fr });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function CalendarDayDrawer({
  day,
  events,
  open,
  onOpenChange,
}: CalendarDayDrawerProps) {
  const title = day ? formatDayDrawerTitle(day) : "";
  const description =
    events.length === 0
      ? "Aucun événement"
      : `${events.length} événement${events.length > 1 ? "s" : ""}`;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="pb-2 text-left">
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription>{description}</DrawerDescription>
        </DrawerHeader>
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto border-t">
          {events.length === 0 ? (
            <p className="text-muted-foreground px-4 py-6 text-sm">
              Aucun événement ce jour-là.
            </p>
          ) : (
            <div className="divide-y">
              {events.map((event) => (
                <ScheduleEventRow
                  key={event.id}
                  event={event}
                  contentSide="top"
                />
              ))}
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
