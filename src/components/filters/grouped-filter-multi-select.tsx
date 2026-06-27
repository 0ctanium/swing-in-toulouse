"use client";

import { Check, ChevronDown, Loader2 } from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type {
  CategoryFilterOption,
  GroupedCategoryFilterOptions,
} from "@/lib/event-category-tags/category-filter-options";
import { cn } from "@/lib/utils";

type GroupedFilterMultiSelectProps = {
  label: string;
  values: string[];
  placeholder: string;
  options?: CategoryFilterOption[];
  groups?: GroupedCategoryFilterOptions;
  isLoading?: boolean;
  onChange: (values: string[]) => void;
};

function formatSelectedSummary(
  values: string[],
  flatOptions: CategoryFilterOption[],
  placeholder: string,
) {
  if (values.length === 0) {
    return placeholder;
  }

  const labels = values.map(
    (value) =>
      flatOptions.find((option) => option.value === value)?.label ?? value,
  );

  if (labels.length === 1) {
    return labels[0];
  }

  if (labels.length === 2) {
    return labels.join(", ");
  }

  return `${labels[0]}, ${labels[1]} +${labels.length - 2}`;
}

function resolveFlatOptions(
  options: CategoryFilterOption[] | undefined,
  groups: GroupedCategoryFilterOptions | undefined,
): CategoryFilterOption[] {
  if (options?.length) {
    return options;
  }

  return groups?.flatMap((group) => group.options) ?? [];
}

function resolveGroups(
  options: CategoryFilterOption[] | undefined,
  groups: GroupedCategoryFilterOptions | undefined,
): GroupedCategoryFilterOptions {
  if (groups?.length) {
    return groups;
  }

  if (!options?.length) {
    return [];
  }

  return [{ groupLabel: "", options }];
}

export function GroupedFilterMultiSelect({
  label,
  values,
  placeholder,
  options,
  groups,
  isLoading = false,
  onChange,
}: GroupedFilterMultiSelectProps) {
  const flatOptions = resolveFlatOptions(options, groups);
  const resolvedGroups = resolveGroups(options, groups);
  const summary = formatSelectedSummary(values, flatOptions, placeholder);
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
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div
              role="listbox"
              aria-multiselectable="true"
              aria-label={label}
              className="flex max-h-60 flex-col gap-0.5 overflow-y-auto"
            >
              {resolvedGroups.map((group) => (
                <div key={group.groupLabel || "__ungrouped__"}>
                  {group.groupLabel ? (
                    <p className="px-2 pt-2 pb-1 text-xs font-medium text-muted-foreground">
                      {group.groupLabel}
                    </p>
                  ) : null}
                  {group.options.map((option) => {
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
              ))}
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
