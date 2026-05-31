"use client";

import { useState } from "react";
import { ListFilter, X } from "lucide-react";
import posthog from "posthog-js";
import { useQueryStates } from "nuqs";

import { GroupedFilterMultiSelect } from "@/components/filters/grouped-filter-multi-select";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  agendaFilterClientParsers,
  hasActiveAgendaFilters,
  type AgendaFilters,
} from "@/lib/events/agenda-filters";
import type { AgendaFilterOptions } from "@/lib/events/agenda-filter-options";
import { useAgendaFilterOptions } from "@/lib/events/use-agenda-filter-options";

type AgendaFiltersBarProps = {
  filters: AgendaFilters;
  onFiltersChange: (filters: Partial<AgendaFilters>) => void;
};

function countActiveFilterDimensions(filters: AgendaFilters) {
  return [filters.category, filters.venue, filters.org].filter(
    (values) => values.length > 0,
  ).length;
}

type AgendaFiltersFieldsProps = {
  filters: AgendaFilters;
  data: AgendaFilterOptions;
  isLoading?: boolean;
  onFiltersChange: (filters: Partial<AgendaFilters>) => void;
};

function AgendaFiltersFields({
  filters,
  data,
  isLoading = false,
  onFiltersChange,
}: AgendaFiltersFieldsProps) {
  const activeFilters = hasActiveAgendaFilters(filters);

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <GroupedFilterMultiSelect
          label="Catégorie"
          values={filters.category}
          placeholder="Toutes les catégories"
          groups={data.categoryGroups}
          isLoading={isLoading}
          onChange={(category) => {
            onFiltersChange({ category });
            posthog.capture("agenda_filter_applied", {
              filter_type: "category",
              values: category,
            });
          }}
        />
        <GroupedFilterMultiSelect
          label="Lieu"
          values={filters.venue}
          placeholder="Tous les lieux"
          options={data.venues}
          isLoading={isLoading}
          onChange={(venue) => {
            onFiltersChange({ venue });
            posthog.capture("agenda_filter_applied", {
              filter_type: "venue",
              values: venue,
            });
          }}
        />
        <GroupedFilterMultiSelect
          label="Organisateur"
          values={filters.org}
          placeholder="Tous les organisateurs"
          options={data.organizations}
          isLoading={isLoading}
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

const emptyFilterOptions: AgendaFilterOptions = {
  categories: [],
  categoryGroups: [],
  venues: [],
  organizations: [],
  venueSlugById: {},
};

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
  const filterData = data ?? emptyFilterOptions;
  const isLoading = isPending && !data;

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
              data={filterData}
              isLoading={isLoading}
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
          data={filterData}
          isLoading={isLoading}
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
