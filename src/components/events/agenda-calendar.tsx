"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Suspense, useEffect, useMemo, useState } from "react";

import { CalendarDayDrawer } from "@/components/events/calendar-day-drawer";
import { CalendarEventChip } from "@/components/events/calendar-event-chip";
import { CalendarEventSpanBar } from "@/components/events/calendar-event-span";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  addMonths,
  addWeeks,
  chunkDaysIntoWeeks,
  formatFourWeekLabel,
  formatMonthLabel,
  getEventsForDay,
  getFourWeekGrid,
  getAgendaCalendarAnchor,
  getFourWeekGridBounds,
  getMonthGrid,
  getMonthGridBounds,
  getWeekDayViews,
  getDaySpanLaneCount,
  getSpanStripHeightStyle,
  getWeekSpanLaneCount,
  CALENDAR_SPAN_STRIP_VARS,
  groupEventsByDay,
  isSameMonth,
  isToday,
  layoutWeekSpanEvents,
  splitCalendarEvents,
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

export function CalendarSkeleton() {
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

export function AgendaCalendarSkeleton({ mode }: { mode: AgendaMode }) {
  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-heading min-w-0 text-base leading-tight font-semibold capitalize sm:text-xl">
          <Suspense>
            <SkeletonLabel mode={mode} />
          </Suspense>
        </h2>
        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs sm:h-8 sm:px-2.5 sm:text-sm"
          >
            Aujourd&apos;hui
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Période précédente"
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Période suivante"
          >
            <ChevronRight />
          </Button>
        </div>
      </div>

      <CalendarSkeleton />
    </div>
  );
}

function SkeletonLabel({ mode }: { mode: AgendaMode }) {
  const [month] = useState(getAgendaCalendarAnchor);
  const [fourWeekAnchor] = useState(getAgendaCalendarAnchor);

  const label =
    mode === "month"
      ? formatMonthLabel(month)
      : formatFourWeekLabel(fourWeekAnchor);

  return label;
}

type CalendarWeekRowProps = {
  weekDays: Date[];
  spanEvents: ReturnType<typeof splitCalendarEvents>["spanEvents"];
  timedEventsByDay: Map<
    string,
    ReturnType<typeof splitCalendarEvents>["timedEvents"][number][]
  >;
  visibleEventCount: number;
  mode: AgendaMode;
  month: Date;
  onOpenDay: (day: Date) => void;
};

function CalendarWeekRow({
  weekDays,
  spanEvents,
  timedEventsByDay,
  visibleEventCount,
  mode,
  month,
  onOpenDay,
}: CalendarWeekRowProps) {
  const spanPlacements = useMemo(
    () => layoutWeekSpanEvents(weekDays, spanEvents),
    [spanEvents, weekDays],
  );
  const weekLaneCount = getWeekSpanLaneCount(spanPlacements, visibleEventCount);
  const visibleSpanPlacements = spanPlacements.filter(
    (placement) => placement.lane < visibleEventCount,
  );
  const dayViews = useMemo(
    () =>
      getWeekDayViews(
        weekDays,
        spanPlacements,
        timedEventsByDay,
        visibleEventCount,
      ),
    [spanPlacements, timedEventsByDay, visibleEventCount, weekDays],
  );

  return (
    <div
      className={cn(
        "relative grid grid-cols-7 overflow-hidden",
        CALENDAR_SPAN_STRIP_VARS,
      )}
    >
      {weekDays.map((day, index) => {
        const inCurrentMonth =
          mode === "month" ? isSameMonth(day, month) : true;
        const { timedEvents, hiddenCount } = dayViews[index]!;
        const dayLaneCount = getDaySpanLaneCount(
          index,
          spanPlacements,
          visibleEventCount,
        );
        const dayLabel = format(day, "EEEE d MMMM", { locale: fr });

        return (
          <div
            key={day.toISOString()}
            className={cn(
              "relative flex min-h-16 flex-col overflow-hidden border-r border-b p-0.5 last:border-r-0 sm:min-h-28 sm:p-2",
              !inCurrentMonth && "bg-muted/20 text-muted-foreground",
              isToday(day) && "bg-primary/5",
            )}
          >
            <button
              type="button"
              className="absolute inset-0 z-0 rounded-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
              aria-label={`Voir les événements du ${dayLabel}`}
              onClick={() => onOpenDay(day)}
            />
            <div className="relative z-10 flex min-h-0 flex-1 flex-col overflow-hidden">
              <div className="pointer-events-none flex shrink-0 justify-center pt-0 sm:pt-0">
                <div
                  className={cn(
                    "flex size-5 items-center justify-center text-[11px] font-medium tabular-nums sm:size-7 sm:text-sm",
                    isToday(day) &&
                      "rounded-full bg-primary text-primary-foreground",
                  )}
                >
                  {format(day, "d", { locale: fr })}
                </div>
              </div>

              {dayLaneCount > 0 ? (
                <div
                  className="pointer-events-none shrink-0"
                  style={{ height: getSpanStripHeightStyle(dayLaneCount) }}
                  aria-hidden
                />
              ) : null}

              <div className="pointer-events-auto flex min-h-0 flex-1 flex-col gap-0.5 overflow-hidden sm:gap-1">
                {timedEvents.map((event) => (
                  <CalendarEventChip key={event.id} event={event} />
                ))}
                {hiddenCount > 0 ? (
                  <button
                    type="button"
                    className="w-full shrink-0 px-0.5 text-center text-[10px] text-muted-foreground underline-offset-2 hover:underline sm:px-1 sm:text-left sm:text-xs"
                    onClick={(event) => {
                      event.stopPropagation();
                      onOpenDay(day);
                    }}
                  >
                    <span className="sm:hidden">+{hiddenCount}</span>
                    <span className="hidden sm:inline">
                      +{hiddenCount} autre{hiddenCount > 1 ? "s" : ""}
                    </span>
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        );
      })}

      {weekLaneCount > 0 ? (
        <div
          className="pointer-events-none absolute inset-x-0 top-[var(--day-head-h)] z-20 px-0.5 sm:px-2 [--span-inset:2px] sm:[--span-inset:4px]"
          style={{ height: getSpanStripHeightStyle(weekLaneCount) }}
        >
          {visibleSpanPlacements.map((placement) => (
            <CalendarEventSpanBar
              key={`${placement.event.id}-${placement.lane}-${placement.startCol}`}
              placement={placement}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function AgendaCalendar({
  mode,
  filters,
  venueSlugById,
}: AgendaCalendarProps) {
  const isMobileLayout = useMobileCalendarLayout();
  const [month, setMonth] = useState(getAgendaCalendarAnchor);
  const [fourWeekAnchor, setFourWeekAnchor] = useState(getAgendaCalendarAnchor);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

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

  const { spanEvents, timedEvents } = useMemo(
    () => splitCalendarEvents(filteredEvents),
    [filteredEvents],
  );

  const timedEventsByDay = useMemo(
    () => groupEventsByDay(timedEvents),
    [timedEvents],
  );

  const eventsByDay = useMemo(
    () => groupEventsByDay(filteredEvents),
    [filteredEvents],
  );

  const days =
    mode === "month" ? getMonthGrid(month) : getFourWeekGrid(fourWeekAnchor);
  const weeks = useMemo(() => chunkDaysIntoWeeks(days), [days]);

  const label =
    mode === "month"
      ? formatMonthLabel(month)
      : formatFourWeekLabel(fourWeekAnchor);

  const selectedDayEvents = useMemo(
    () => (selectedDay ? getEventsForDay(eventsByDay, selectedDay) : []),
    [eventsByDay, selectedDay],
  );

  function openDaySheet(day: Date) {
    setSelectedDay(day);
  }

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
        <div className="overflow-hidden rounded-xl border">
          <div className="grid grid-cols-7 border-b bg-muted/40">
            {WEEKDAY_LABELS.map((weekday, index) => (
              <div
                key={weekday}
                className="px-0.5 py-1.5 text-center text-[10px] font-medium text-muted-foreground sm:px-2 sm:py-2 sm:text-xs sm:uppercase"
              >
                <span className="sm:hidden">
                  {WEEKDAY_LABELS_COMPACT[index]}
                </span>
                <span className="hidden sm:inline">{weekday}</span>
              </div>
            ))}
          </div>

          {weeks.map((weekDays) => (
            <CalendarWeekRow
              key={weekDays[0]!.toISOString()}
              weekDays={weekDays}
              spanEvents={spanEvents}
              timedEventsByDay={timedEventsByDay}
              visibleEventCount={visibleEventCount}
              mode={mode}
              month={month}
              onOpenDay={openDaySheet}
            />
          ))}
        </div>
      )}

      <CalendarDayDrawer
        day={selectedDay}
        events={selectedDayEvents}
        open={selectedDay !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedDay(null);
          }
        }}
      />
    </div>
  );
}
