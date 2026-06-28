"use client";

import { Check, ChevronDown, Search, X } from "lucide-react";
import { useEffect, useState } from "react";

import { GroupedFilterMultiSelect } from "@/components/filters/grouped-filter-multi-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DEFAULT_ADMIN_EVENT_VIEW,
  hasAdminEventsFilters,
  type AdminEventStateFilter,
  type AdminEventView,
  type AdminEventsQuery,
} from "@/lib/events/admin-events-params";
import type {
  AdminEventFilterOption,
  AdminEventsFilterOptions,
} from "@/lib/events/admin-events-table";
import { cn } from "@/lib/utils";

type EventsTableFiltersProps = {
  query: AdminEventsQuery;
  options: AdminEventsFilterOptions;
  onQueryChange: (query: Partial<AdminEventsQuery>) => void;
};

const VIEW_TABS: Array<{ value: AdminEventView; label: string }> = [
  { value: "upcoming", label: "À venir" },
  { value: "pending", label: "À confirmer" },
  { value: "past", label: "Passés" },
  { value: "all", label: "Tous" },
];

const VIEW_LABELS = Object.fromEntries(
  VIEW_TABS.map((tab) => [tab.value, tab.label]),
) as Record<AdminEventView, string>;

function formatSelectedSummary(
  values: string[],
  options: AdminEventFilterOption[],
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
  onChange,
}: {
  label: string;
  values: string[];
  placeholder: string;
  options: AdminEventFilterOption[];
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
          className={cn(
            "flex h-8 w-full items-center justify-between gap-2 rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30 dark:hover:bg-input/50",
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

function ActiveFilterChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <button
      type="button"
      className="inline-flex items-center gap-1 rounded-full border bg-background px-2.5 py-1 text-xs transition-colors hover:bg-accent"
      onClick={onRemove}
    >
      {label}
      <X className="size-3" />
    </button>
  );
}

export function EventsTableFilters({
  query,
  options,
  onQueryChange,
}: EventsTableFiltersProps) {
  const [searchInput, setSearchInput] = useState(query.search);
  const activeFilters = hasAdminEventsFilters(query);

  useEffect(() => {
    setSearchInput(query.search);
  }, [query.search]);

  function submitSearch(event: React.FormEvent) {
    event.preventDefault();
    onQueryChange({ search: searchInput.trim(), page: 1 });
  }

  function clearAllFilters() {
    onQueryChange({
      search: "",
      view: DEFAULT_ADMIN_EVENT_VIEW,
      venue: [],
      org: [],
      category: [],
      state: [],
      page: 1,
    });
    setSearchInput("");
  }

  return (
    <div className="flex flex-col gap-3">
      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={submitSearch}
      >
        <div className="flex min-w-56 flex-1 flex-col gap-1.5">
          <label htmlFor="event-search" className="text-xs font-medium">
            Rechercher
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="event-search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Titre, lieu, organisateur…"
              className="pl-8"
            />
          </div>
        </div>
        <Button type="submit" variant="secondary" size="sm" className="h-8">
          Rechercher
        </Button>
      </form>

      <div className="flex flex-wrap gap-1.5">
        {VIEW_TABS.map((tab) => {
          const active = query.view === tab.value;

          return (
            <Button
              key={tab.value}
              type="button"
              size="sm"
              variant={active ? "default" : "outline"}
              className="h-8"
              onClick={() => onQueryChange({ view: tab.value, page: 1 })}
            >
              {tab.label}
            </Button>
          );
        })}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <FilterMultiSelect
          label="Lieu"
          values={query.venue}
          placeholder="Tous les lieux"
          options={options.venues}
          onChange={(venue) => onQueryChange({ venue, page: 1 })}
        />
        <FilterMultiSelect
          label="Organisateur"
          values={query.org}
          placeholder="Tous les organisateurs"
          options={options.organizations}
          onChange={(org) => onQueryChange({ org, page: 1 })}
        />
        <GroupedFilterMultiSelect
          label="Catégorie"
          values={query.category}
          placeholder="Toutes les catégories"
          groups={options.categoryGroups}
          onChange={(category) => onQueryChange({ category, page: 1 })}
        />
        <FilterMultiSelect
          label="État"
          values={query.state}
          placeholder="Tous les états"
          options={options.states}
          onChange={(state) =>
            onQueryChange({
              state: state as AdminEventStateFilter[],
              page: 1,
            })
          }
        />
      </div>

      {activeFilters ? (
        <div className="flex flex-wrap items-center gap-2">
          {query.search ? (
            <ActiveFilterChip
              label={`Recherche : ${query.search}`}
              onRemove={() => {
                setSearchInput("");
                onQueryChange({ search: "", page: 1 });
              }}
            />
          ) : null}
          {query.view !== DEFAULT_ADMIN_EVENT_VIEW ? (
            <ActiveFilterChip
              label={`Vue : ${VIEW_LABELS[query.view]}`}
              onRemove={() =>
                onQueryChange({ view: DEFAULT_ADMIN_EVENT_VIEW, page: 1 })
              }
            />
          ) : null}
          {query.venue.map((value) => (
            <ActiveFilterChip
              key={`venue-${value}`}
              label={`Lieu : ${options.venues.find((option) => option.value === value)?.label ?? value}`}
              onRemove={() =>
                onQueryChange({
                  venue: query.venue.filter((current) => current !== value),
                  page: 1,
                })
              }
            />
          ))}
          {query.org.map((value) => (
            <ActiveFilterChip
              key={`org-${value}`}
              label={`Organisateur : ${options.organizations.find((option) => option.value === value)?.label ?? value}`}
              onRemove={() =>
                onQueryChange({
                  org: query.org.filter((current) => current !== value),
                  page: 1,
                })
              }
            />
          ))}
          {query.category.map((value) => (
            <ActiveFilterChip
              key={`category-${value}`}
              label={`Catégorie : ${options.categories.find((option) => option.value === value)?.label ?? value}`}
              onRemove={() =>
                onQueryChange({
                  category: query.category.filter((current) => current !== value),
                  page: 1,
                })
              }
            />
          ))}
          {query.state.map((value) => (
            <ActiveFilterChip
              key={`state-${value}`}
              label={`État : ${options.states.find((option) => option.value === value)?.label ?? value}`}
              onRemove={() =>
                onQueryChange({
                  state: query.state.filter((current) => current !== value),
                  page: 1,
                })
              }
            />
          ))}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-muted-foreground"
            onClick={clearAllFilters}
          >
            Tout effacer
          </Button>
        </div>
      ) : null}
    </div>
  );
}
