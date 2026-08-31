"use client";

import { useEffect, useMemo, useState } from "react";
import posthog from "posthog-js";

import {
  AgendaCalendar,
  AgendaCalendarSkeleton,
} from "@/components/events/agenda-calendar";
import {
  AgendaFiltersBar,
  AgendaFiltersBarSkeleton,
  useAgendaFilterContext,
} from "@/components/events/agenda-filters";
import { CompactPlanningView } from "@/components/events/compact-planning-view";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  clampAgendaMode,
  clampViewMode,
  getAgendaModeToggleOptions,
  getViewModeToggleOptions,
  mergeAgendaDisplayConfig,
  resolveAgendaPreferencesForDisplay,
  shouldShowAgendaModeToggle,
  shouldShowViewModeToggle,
  type AgendaDisplayConfig,
} from "@/lib/events/agenda-display-config";
import { filterAgendaOccurrences } from "@/lib/events/agenda-filters";
import type { AgendaBaseFilters } from "@/lib/events/agenda-filters";
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
  const {
    data: events = [],
    isPending,
    isError,
    refetch,
  } = usePlanningEvents();
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
  baseFilters?: AgendaBaseFilters;
  displayConfig?: Partial<AgendaDisplayConfig>;
  persistPreferences?: boolean;
};

export function AgendaView({
  initialPreferences = defaultAgendaPreferences,
  baseFilters,
  displayConfig: displayConfigInput,
  persistPreferences = true,
}: AgendaViewProps) {
  const displayConfig = useMemo(
    () => mergeAgendaDisplayConfig(displayConfigInput),
    [displayConfigInput],
  );
  const resolvedInitialPreferences = useMemo(
    () =>
      resolveAgendaPreferencesForDisplay(initialPreferences, displayConfig),
    [initialPreferences, displayConfig],
  );
  const viewModeOptions = useMemo(
    () => getViewModeToggleOptions(displayConfig),
    [displayConfig],
  );
  const agendaModeOptions = useMemo(
    () => getAgendaModeToggleOptions(displayConfig),
    [displayConfig],
  );
  const showViewModeToggle = shouldShowViewModeToggle(displayConfig);
  const showAgendaModeToggle = shouldShowAgendaModeToggle(displayConfig);

  const { filters, setFilters, venueSlugById } =
    useAgendaFilterContext(baseFilters);
  const [viewMode, setViewMode] = useState<ViewMode>(
    resolvedInitialPreferences.viewMode,
  );
  const [agendaMode, setAgendaMode] = useState<AgendaMode>(
    resolvedInitialPreferences.agendaMode,
  );

  useEffect(() => {
    if (!persistPreferences) {
      return;
    }

    writeAgendaPreferencesCookie({ viewMode, agendaMode });
  }, [viewMode, agendaMode, persistPreferences]);

  useEffect(() => {
    setViewMode((current) => clampViewMode(current, displayConfig));
    setAgendaMode((current) => clampAgendaMode(current, displayConfig));
  }, [displayConfig]);

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {displayConfig.showFilters ? (
        <AgendaFiltersBar
          filters={filters}
          baseFilters={baseFilters}
          onFiltersChange={(nextFilters) => {
            void setFilters(nextFilters);
          }}
        />
      ) : null}

      {showViewModeToggle || showAgendaModeToggle ? (
        <div className="flex flex-wrap items-center gap-2">
          {showViewModeToggle ? (
            <ViewToggle
              value={viewMode}
              options={viewModeOptions}
              onChange={(value) => {
                const nextViewMode = clampViewMode(
                  value as ViewMode,
                  displayConfig,
                );
                setViewMode(nextViewMode);
                posthog.capture("agenda_view_changed", { view: nextViewMode });
              }}
            />
          ) : null}

          {viewMode === "agenda" && showAgendaModeToggle ? (
            <ViewToggle
              value={agendaMode}
              options={agendaModeOptions}
              onChange={(value) =>
                setAgendaMode(clampAgendaMode(value as AgendaMode, displayConfig))
              }
            />
          ) : null}
        </div>
      ) : null}

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

export function AgendaViewSkeleton({
  preferences,
  baseFilters,
  displayConfig: displayConfigInput,
}: {
  preferences?: AgendaPreferences | null;
  baseFilters?: AgendaBaseFilters;
  displayConfig?: Partial<AgendaDisplayConfig>;
}) {
  const displayConfig = mergeAgendaDisplayConfig(displayConfigInput);
  const resolvedPreferences = preferences
    ? resolveAgendaPreferencesForDisplay(preferences, displayConfig)
    : null;
  const viewModeOptions = getViewModeToggleOptions(displayConfig);
  const agendaModeOptions = getAgendaModeToggleOptions(displayConfig);
  const showViewModeToggle = shouldShowViewModeToggle(displayConfig);
  const showAgendaModeToggle = shouldShowAgendaModeToggle(displayConfig);

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {displayConfig.showFilters ? (
        <AgendaFiltersBarSkeleton baseFilters={baseFilters} />
      ) : null}

      {resolvedPreferences ? (
        <>
          {showViewModeToggle || showAgendaModeToggle ? (
            <div className="flex flex-wrap items-center gap-2">
              {showViewModeToggle ? (
                <ViewToggle
                  value={resolvedPreferences.viewMode}
                  options={viewModeOptions}
                  onChange={() => void 0}
                />
              ) : null}

              {resolvedPreferences.viewMode === "agenda" &&
              showAgendaModeToggle ? (
                <ViewToggle
                  value={resolvedPreferences.agendaMode}
                  options={agendaModeOptions}
                  onChange={() => void 0}
                />
              ) : null}
            </div>
          ) : null}

          {resolvedPreferences.viewMode === "planning" ? (
            <PlanningListSkeleton />
          ) : (
            <AgendaCalendarSkeleton mode={resolvedPreferences.agendaMode} />
          )}
        </>
      ) : (
        <div className="flex flex-col gap-4">
          {showViewModeToggle ? <Skeleton className="h-10 w-48" /> : null}
          <Skeleton className="h-24 w-full" />
        </div>
      )}
    </div>
  );
}
