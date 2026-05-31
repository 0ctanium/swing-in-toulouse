"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

import { EventPreviewPopover } from "@/components/events/event-preview-popover";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  addMonths,
  addWeeks,
  formatFourWeekLabel,
  formatMonthLabel,
  getEventsForDay,
  getFourWeekGrid,
  getFourWeekGridBounds,
  getMonthGrid,
  getMonthGridBounds,
  groupEventsByDay,
  isSameMonth,
  isToday,
  WEEKDAY_LABELS,
} from "@/lib/events/calendar";
import type { AgendaFilters } from "@/lib/events/agenda-filters";
import { filterAgendaOccurrences } from "@/lib/events/agenda-filters";
import { useEvents } from "@/lib/events/use-events";
import { cn } from "@/lib/utils";

type AgendaMode = "month" | "4-weeks";

type AgendaCalendarProps = {
  mode: AgendaMode;
  filters: AgendaFilters;
  venueSlugById: Record<string, string>;
};

function CalendarSkeleton() {
  return (
    <div className="overflow-x-auto rounded-xl border">
      <div className="grid min-w-[640px] grid-cols-7 border-b bg-muted/40">
        {WEEKDAY_LABELS.map((label) => (
          <div
            key={label}
            className="px-2 py-2 text-center text-xs font-medium text-muted-foreground uppercase"
          >
            {label}
          </div>
        ))}
      </div>
      <div className="grid min-w-[640px] grid-cols-7">
        {Array.from({ length: 35 }).map((_, index) => (
          <div
            key={index}
            className="flex min-h-28 flex-col gap-2 border-r border-b p-2 last:border-r-0"
          >
            <Skeleton className="size-7 rounded-full" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function AgendaCalendar({
  mode,
  filters,
  venueSlugById,
}: AgendaCalendarProps) {
  const [month, setMonth] = useState(() => new Date());
  const [fourWeekAnchor, setFourWeekAnchor] = useState(() => new Date());

  const range = useMemo(
    () =>
      mode === "month"
        ? getMonthGridBounds(month)
        : getFourWeekGridBounds(fourWeekAnchor),
    [mode, month, fourWeekAnchor],
  );

  const {
    data: events = [],
    isPending,
    isError,
    refetch,
  } = useEvents({ from: range.from, to: range.to });

  const filteredEvents = useMemo(
    () => filterAgendaOccurrences(events, filters, venueSlugById),
    [events, filters, venueSlugById],
  );

  const eventsByDay = useMemo(
    () => groupEventsByDay(filteredEvents),
    [filteredEvents],
  );

  const days =
    mode === "month" ? getMonthGrid(month) : getFourWeekGrid(fourWeekAnchor);

  const label =
    mode === "month"
      ? formatMonthLabel(month)
      : formatFourWeekLabel(fourWeekAnchor);

  function goBack() {
    if (mode === "month") {
      setMonth((current) => addMonths(current, -1));
      return;
    }

    setFourWeekAnchor((current) => addWeeks(current, -4));
  }

  function goForward() {
    if (mode === "month") {
      setMonth((current) => addMonths(current, 1));
      return;
    }

    setFourWeekAnchor((current) => addWeeks(current, 4));
  }

  function goToday() {
    const today = new Date();
    setMonth(today);
    setFourWeekAnchor(today);
  }

  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-heading min-w-0 text-base leading-tight font-semibold capitalize sm:text-xl">
          {label}
        </h2>
        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs sm:h-8 sm:px-2.5 sm:text-sm"
            onClick={goToday}
          >
            Aujourd&apos;hui
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={goBack}
            aria-label="Période précédente"
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            onClick={goForward}
            aria-label="Période suivante"
          >
            <ChevronRight />
          </Button>
        </div>
      </div>

      {isError ? (
        <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed p-6">
          <p className="text-muted-foreground text-sm">
            Impossible de charger les événements pour cette période.
          </p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Réessayer
          </Button>
        </div>
      ) : isPending ? (
        <CalendarSkeleton />
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <div className="grid min-w-[640px] grid-cols-7 border-b bg-muted/40">
            {WEEKDAY_LABELS.map((weekday) => (
              <div
                key={weekday}
                className="px-2 py-2 text-center text-xs font-medium text-muted-foreground uppercase"
              >
                {weekday}
              </div>
            ))}
          </div>

          <div className="grid min-w-[640px] grid-cols-7">
            {days.map((day) => {
              const dayEvents = getEventsForDay(eventsByDay, day);
              const inCurrentMonth =
                mode === "month" ? isSameMonth(day, month) : true;

              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "flex min-h-28 flex-col gap-1 border-r border-b p-2 last:border-r-0",
                    !inCurrentMonth && "bg-muted/20 text-muted-foreground",
                    isToday(day) &&
                      "bg-primary/5 ring-1 ring-primary/20 ring-inset",
                  )}
                >
                  <div
                    className={cn(
                      "flex size-7 items-center justify-center rounded-full text-sm font-medium",
                      isToday(day) && "bg-primary text-primary-foreground",
                    )}
                  >
                    {format(day, "d", { locale: fr })}
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {dayEvents.slice(0, 3).map((event) => (
                      <EventPreviewPopover key={event.id} event={event} />
                    ))}
                    {dayEvents.length > 3 ? (
                      <span className="px-1 text-xs text-muted-foreground">
                        +{dayEvents.length - 3} autre
                        {dayEvents.length - 3 > 1 ? "s" : ""}
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
