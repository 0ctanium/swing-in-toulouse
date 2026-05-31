"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { CalendarEventChip } from "@/components/events/calendar-event-chip";
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
  WEEKDAY_LABELS_COMPACT,
} from "@/lib/events/calendar";
import type { AgendaFilters } from "@/lib/events/agenda-filters";
import { filterAgendaOccurrences } from "@/lib/events/agenda-filters";
import { useEvents } from "@/lib/events/use-events";
import { cn } from "@/lib/utils";

type AgendaMode = "month" | "4-weeks";

const MOBILE_CALENDAR_MEDIA_QUERY = "(max-width: 639px)";
const MOBILE_VISIBLE_EVENTS = 2;
const DESKTOP_VISIBLE_EVENTS = 3;

type AgendaCalendarProps = {
  mode: AgendaMode;
  filters: AgendaFilters;
  venueSlugById: Record<string, string>;
};

function useMobileCalendarLayout() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(MOBILE_CALENDAR_MEDIA_QUERY);

    function updateLayout() {
      setIsMobile(mediaQuery.matches);
    }

    updateLayout();
    mediaQuery.addEventListener("change", updateLayout);
    return () => mediaQuery.removeEventListener("change", updateLayout);
  }, []);

  return isMobile;
}

function CalendarSkeleton() {
  return (
    <div className="rounded-xl border">
      <div className="grid grid-cols-7 border-b bg-muted/40">
        {WEEKDAY_LABELS_COMPACT.map((label, index) => (
          <div
            key={`${label}-${index}`}
            className="px-0.5 py-1.5 text-center text-[10px] font-medium text-muted-foreground sm:px-2 sm:py-2 sm:text-xs sm:uppercase"
          >
            <span className="sm:hidden">{label}</span>
            <span className="hidden sm:inline">{WEEKDAY_LABELS[index]}</span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {Array.from({ length: 35 }).map((_, index) => (
          <div
            key={index}
            className="flex min-h-16 flex-col gap-0.5 border-r border-b p-0.5 last:border-r-0 sm:min-h-28 sm:gap-1 sm:p-2"
          >
            <Skeleton className="mx-auto size-5 rounded-full sm:size-7" />
            <Skeleton className="h-2.5 w-full sm:h-3" />
            <Skeleton className="hidden h-3 w-4/5 sm:block" />
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
  const isMobileLayout = useMobileCalendarLayout();
  const [month, setMonth] = useState(() => new Date());
  const [fourWeekAnchor, setFourWeekAnchor] = useState(() => new Date());

  const visibleEventCount = isMobileLayout
    ? MOBILE_VISIBLE_EVENTS
    : DESKTOP_VISIBLE_EVENTS;

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
        <div className="rounded-xl border">
          <div className="grid grid-cols-7 border-b bg-muted/40">
            {WEEKDAY_LABELS.map((weekday, index) => (
              <div
                key={weekday}
                className="px-0.5 py-1.5 text-center text-[10px] font-medium text-muted-foreground sm:px-2 sm:py-2 sm:text-xs sm:uppercase"
              >
                <span className="sm:hidden">{WEEKDAY_LABELS_COMPACT[index]}</span>
                <span className="hidden sm:inline">{weekday}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {days.map((day) => {
              const dayEvents = getEventsForDay(eventsByDay, day);
              const inCurrentMonth =
                mode === "month" ? isSameMonth(day, month) : true;
              const hiddenCount = Math.max(
                0,
                dayEvents.length - visibleEventCount,
              );

              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "flex min-h-16 flex-col gap-0.5 border-r border-b p-0.5 last:border-r-0 sm:min-h-28 sm:gap-1 sm:p-2",
                    !inCurrentMonth && "bg-muted/20 text-muted-foreground",
                    isToday(day) &&
                      "bg-primary/5 ring-1 ring-primary/20 ring-inset",
                  )}
                >
                  <div
                    className={cn(
                      "mx-auto flex size-5 items-center justify-center text-[11px] font-medium tabular-nums sm:size-7 sm:text-sm",
                      isToday(day) && "rounded-full bg-primary text-primary-foreground",
                    )}
                  >
                    {format(day, "d", { locale: fr })}
                  </div>
                  <div className="flex min-h-0 flex-1 flex-col gap-px sm:gap-0.5">
                    {dayEvents.slice(0, visibleEventCount).map((event) => (
                      <CalendarEventChip key={event.id} event={event} />
                    ))}
                    {hiddenCount > 0 ? (
                      <span className="px-0.5 text-center text-[10px] text-muted-foreground sm:px-1 sm:text-left sm:text-xs">
                        <span className="sm:hidden">+{hiddenCount}</span>
                        <span className="hidden sm:inline">
                          +{hiddenCount} autre{hiddenCount > 1 ? "s" : ""}
                        </span>
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
