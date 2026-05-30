"use client";

import { useEffect, useMemo, useState } from "react";

import { AgendaCalendar } from "@/components/events/agenda-calendar";
import {
  AgendaFiltersBar,
  useAgendaFilterContext,
} from "@/components/events/agenda-filters";
import { EventList } from "@/components/events/event-list";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { filterAgendaOccurrences } from "@/lib/events/agenda-filters";
import {
  defaultAgendaPreferences,
  type AgendaMode,
  type AgendaPreferences,
  type ViewMode,
  writeAgendaPreferencesCookie,
} from "@/lib/events/agenda-preferences";
import { usePlanningEvents } from "@/lib/events/use-events";
import { cn } from "@/lib/utils";

function ViewToggle({
  value,
  options,
  onChange,
}: {
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border bg-muted/40 p-1">
      {options.map((option) => (
        <Button
          key={option.value}
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            "rounded-md",
            value === option.value && "bg-background shadow-sm",
          )}
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </Button>
      ))}
    </div>
  );
}

function PlanningListSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="flex flex-col gap-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
      ))}
    </div>
  );
}

type PlanningListProps = {
  filters: ReturnType<typeof useAgendaFilterContext>["filters"];
  venueSlugById: Record<string, string>;
};

function PlanningList({ filters, venueSlugById }: PlanningListProps) {
  const { data: events = [], isPending, isError, refetch } = usePlanningEvents();
  const filteredEvents = useMemo(
    () => filterAgendaOccurrences(events, filters, venueSlugById),
    [events, filters, venueSlugById],
  );

  if (isError) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed p-6">
        <p className="text-muted-foreground text-sm">
          Impossible de charger les événements.
        </p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Réessayer
        </Button>
      </div>
    );
  }

  if (isPending) {
    return <PlanningListSkeleton />;
  }

  return (
    <EventList
      events={filteredEvents}
      emptyMessage="Aucun événement ne correspond à ces filtres."
    />
  );
}

type AgendaViewProps = {
  initialPreferences?: AgendaPreferences;
};

export function AgendaView({
  initialPreferences = defaultAgendaPreferences,
}: AgendaViewProps) {
  const { filters, setFilters, venueSlugById } = useAgendaFilterContext();
  const [viewMode, setViewMode] = useState<ViewMode>(initialPreferences.viewMode);
  const [agendaMode, setAgendaMode] = useState<AgendaMode>(
    initialPreferences.agendaMode,
  );

  useEffect(() => {
    writeAgendaPreferencesCookie({ viewMode, agendaMode });
  }, [viewMode, agendaMode]);

  return (
    <div className="flex flex-col gap-6">
      <AgendaFiltersBar
        filters={filters}
        onFiltersChange={(nextFilters) => {
          void setFilters(nextFilters);
        }}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <ViewToggle
          value={viewMode}
          options={[
            { value: "agenda", label: "Agenda" },
            { value: "planning", label: "Planning" },
          ]}
          onChange={(value) => setViewMode(value as ViewMode)}
        />

        {viewMode === "agenda" ? (
          <ViewToggle
            value={agendaMode}
            options={[
              { value: "month", label: "Mois" },
              { value: "4-weeks", label: "4 semaines" },
            ]}
            onChange={(value) => setAgendaMode(value as AgendaMode)}
          />
        ) : null}
      </div>

      {viewMode === "planning" ? (
        <PlanningList filters={filters} venueSlugById={venueSlugById} />
      ) : (
        <AgendaCalendar
          mode={agendaMode}
          filters={filters}
          venueSlugById={venueSlugById}
        />
      )}
    </div>
  );
}
