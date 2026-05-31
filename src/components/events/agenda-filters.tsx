"use client";

import { useState } from "react";
import { Check, ChevronDown, ListFilter, X } from "lucide-react";
import posthog from "posthog-js";
import { useQueryStates } from "nuqs";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import {
  agendaFilterClientParsers,
  hasActiveAgendaFilters,
  type AgendaFilters,
} from "@/lib/events/agenda-filters";
import type { AgendaFilterOptions } from "@/lib/events/agenda-filter-options";
import { useAgendaFilterOptions } from "@/lib/events/use-agenda-filter-options";
import { cn } from "@/lib/utils";

type AgendaFiltersBarProps = {
  filters: AgendaFilters;
  onFiltersChange: (filters: Partial<AgendaFilters>) => void;
};

function countActiveFilterDimensions(filters: AgendaFilters) {
  return [filters.category, filters.venue, filters.org].filter(
    (values) => values.length > 0,
  ).length;
}

function formatSelectedSummary(
  values: string[],
  options: AgendaFilterOptions["categories"],
  placeholder: string,
) {
  if (values.length === 0) {
    return placeholder;
  }

  const labels = values.map(
    (value) => options.find((option) => option.value === value)?.label ?? value,
  );

  if (labels.length === 1) {
    return labels[0];
  }

  if (labels.length === 2) {
    return labels.join(", ");
  }

  return `${labels[0]}, ${labels[1]} +${labels.length - 2}`;
}

function FilterMultiSelect({
  label,
  values,
  placeholder,
  options,
  disabled,
  onChange,
}: {
  label: string;
  values: string[];
  placeholder: string;
  options: AgendaFilterOptions["categories"];
  disabled?: boolean;
  onChange: (values: string[]) => void;
}) {
  const summary = formatSelectedSummary(values, options, placeholder);
  const hasSelection = values.length > 0;

  function toggleValue(value: string) {
    if (values.includes(value)) {
      onChange(values.filter((current) => current !== value));
      return;
    }

    onChange([...values, value]);
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:max-w-56">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <Popover>
        <PopoverTrigger
          disabled={disabled}
          className={cn(
            "flex h-8 w-full items-center justify-between gap-2 rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30 dark:hover:bg-input/50",
            !hasSelection && "text-muted-foreground",
          )}
        >
          <span className="min-w-0 truncate text-left">{summary}</span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </PopoverTrigger>
        <PopoverContent
          align="start"
          side="bottom"
          sideOffset={6}
          className="w-(--anchor-width) min-w-56 p-1"
        >
          <div
            role="listbox"
            aria-multiselectable="true"
            aria-label={label}
            className="flex max-h-60 flex-col gap-0.5 overflow-y-auto"
          >
            {options.map((option) => {
              const selected = values.includes(option.value);

              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                    selected && "bg-accent/60",
                  )}
                  onClick={() => toggleValue(option.value)}
                >
                  <span
                    className={cn(
                      "flex size-4 shrink-0 items-center justify-center rounded-sm border",
                      selected
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input bg-background",
                    )}
                  >
                    {selected ? <Check className="size-3" /> : null}
                  </span>
                  <span className="min-w-0 truncate">{option.label}</span>
                </button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

type AgendaFiltersFieldsProps = {
  filters: AgendaFilters;
  data: AgendaFilterOptions;
  onFiltersChange: (filters: Partial<AgendaFilters>) => void;
};

function AgendaFiltersFields({
  filters,
  data,
  onFiltersChange,
}: AgendaFiltersFieldsProps) {
  const activeFilters = hasActiveAgendaFilters(filters);

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <FilterMultiSelect
          label="Catégorie"
          values={filters.category}
          placeholder="Toutes les catégories"
          options={data.categories}
          onChange={(category) => {
            onFiltersChange({ category });
            posthog.capture("agenda_filter_applied", {
              filter_type: "category",
              values: category,
            });
          }}
        />
        <FilterMultiSelect
          label="Lieu"
          values={filters.venue}
          placeholder="Tous les lieux"
          options={data.venues}
          onChange={(venue) => {
            onFiltersChange({ venue });
            posthog.capture("agenda_filter_applied", {
              filter_type: "venue",
              values: venue,
            });
          }}
        />
        <FilterMultiSelect
          label="Organisateur"
          values={filters.org}
          placeholder="Tous les organisateurs"
          options={data.organizations}
          onChange={(org) => {
            onFiltersChange({ org });
            posthog.capture("agenda_filter_applied", {
              filter_type: "organizer",
              values: org,
            });
          }}
        />
      </div>
      {activeFilters ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 w-fit px-2 text-muted-foreground"
          onClick={() => {
            onFiltersChange({ category: [], venue: [], org: [] });
            posthog.capture("agenda_filter_cleared");
          }}
        >
          <X data-icon="inline-start" />
          Effacer les filtres
        </Button>
      ) : null}
    </div>
  );
}

function AgendaFiltersSkeleton() {
  return (
    <>
      <Skeleton className="h-9 w-full sm:hidden" />
      <div className="hidden gap-3 sm:grid sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="flex flex-col gap-1.5">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-full" />
          </div>
        ))}
      </div>
    </>
  );
}

export function useAgendaFiltersState() {
  return useQueryStates(agendaFilterClientParsers, {
    history: "replace",
    shallow: false,
  });
}

export function AgendaFiltersBar({
  filters,
  onFiltersChange,
}: AgendaFiltersBarProps) {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const { data, isPending, isError, refetch } = useAgendaFilterOptions();

  if (isError) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed p-4">
        <p className="text-muted-foreground text-sm">
          Impossible de charger les filtres.
        </p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Réessayer
        </Button>
      </div>
    );
  }

  if (isPending || !data) {
    return <AgendaFiltersSkeleton />;
  }

  const activeFilterCount = countActiveFilterDimensions(filters);

  return (
    <>
      <div className="sm:hidden">
        <Dialog open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
          <DialogTrigger
            render={
              <Button variant="outline" className="h-9 w-full justify-between">
                <span className="inline-flex items-center gap-2">
                  <ListFilter className="size-4" />
                  Filtres
                </span>
                {activeFilterCount > 0 ? (
                  <span className="bg-primary text-primary-foreground flex size-5 items-center justify-center rounded-full text-xs font-medium tabular-nums">
                    {activeFilterCount}
                  </span>
                ) : null}
              </Button>
            }
          />
          <DialogContent className="top-4 left-4 right-4 w-auto max-w-none translate-none sm:top-1/2 sm:left-1/2 sm:right-auto sm:w-full sm:max-w-md sm:-translate-x-1/2 sm:-translate-y-1/2">
            <DialogHeader>
              <DialogTitle>Filtres</DialogTitle>
            </DialogHeader>
            <AgendaFiltersFields
              filters={filters}
              data={data}
              onFiltersChange={(nextFilters) => {
                onFiltersChange(nextFilters);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="hidden sm:block">
        <AgendaFiltersFields
          filters={filters}
          data={data}
          onFiltersChange={onFiltersChange}
        />
      </div>
    </>
  );
}

export function useAgendaFilterContext() {
  const [filters, setFilters] = useAgendaFiltersState();
  const { data: filterOptions } = useAgendaFilterOptions();

  return {
    filters,
    setFilters,
    filterOptions,
    venueSlugById: filterOptions?.venueSlugById ?? {},
  };
}
