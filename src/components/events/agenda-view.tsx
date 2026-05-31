"use client";

import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import posthog from "posthog-js";

import { AgendaCalendar } from "@/components/events/agenda-calendar";
import {
  AgendaFiltersBar,
  useAgendaFilterContext,
} from "@/components/events/agenda-filters";
import { CompactPlanningView } from "@/components/events/compact-planning-view";
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

const AGENDA_MOBILE_MEDIA_QUERY = "(max-width: 639px)";

function ViewToggle({
  value,
  options,
  onChange,
  className,
}: {
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex rounded-lg border bg-muted/40 p-0.5 sm:p-1",
        className,
      )}
    >
      {options.map((option) => (
        <Button
          key={option.value}
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            "h-7 rounded-md px-2.5 text-xs sm:h-8 sm:px-3 sm:text-sm",
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
    <CompactPlanningView
      events={filteredEvents}
      emptyMessage="Aucun événement ne correspond à ces filtres."
    />
  );
}

type AgendaViewProps = {
  initialPreferences?: AgendaPreferences;
  hasStoredPreferences?: boolean;
};

export function AgendaView({
  initialPreferences = defaultAgendaPreferences,
  hasStoredPreferences = false,
}: AgendaViewProps) {
  const { filters, setFilters, venueSlugById } = useAgendaFilterContext();
  const [viewMode, setViewMode] = useState<ViewMode>(initialPreferences.viewMode);
  const [agendaMode, setAgendaMode] = useState<AgendaMode>(
    initialPreferences.agendaMode,
  );

  useLayoutEffect(() => {
    if (hasStoredPreferences) {
      return;
    }

    if (window.matchMedia(AGENDA_MOBILE_MEDIA_QUERY).matches) {
      setViewMode("planning");
    }
  }, [hasStoredPreferences]);

  useEffect(() => {
    writeAgendaPreferencesCookie({ viewMode, agendaMode });
  }, [viewMode, agendaMode]);

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <AgendaFiltersBar
        filters={filters}
        onFiltersChange={(nextFilters) => {
          void setFilters(nextFilters);
        }}
      />

      <div className="flex flex-wrap items-center gap-2">
        <ViewToggle
          value={viewMode}
          options={[
            { value: "agenda", label: "Agenda" },
            { value: "planning", label: "Planning" },
          ]}
          onChange={(value) => {
            setViewMode(value as ViewMode);
            posthog.capture("agenda_view_changed", { view: value });
          }}
        />

        {viewMode === "agenda" ? (
          <ViewToggle
            value={agendaMode}
            options={[
              { value: "month", label: "Mois" },
              { value: "4-weeks", label: "4 sem." },
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
