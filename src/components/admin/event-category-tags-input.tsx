"use client";

import { Check, Plus } from "lucide-react";
import { useMemo, useState } from "react";

import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxSeparator,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox";
import { Button } from "@/components/ui/button";
import { useEventCategoryTagOptions } from "@/lib/admin/use-event-category-tag-options";
import {
  flattenGroupedCategoryFilterOptions,
  type GroupedCategoryFilterOptions,
} from "@/lib/event-category-tags/category-filter-options";
import { suggestCategoryTagsFromText } from "@/lib/event-category-tags/suggest-from-text";
import { cn } from "@/lib/utils";

type EventCategoryTagsInputProps = {
  value: string[];
  onChange: (value: string[]) => void;
  groups?: GroupedCategoryFilterOptions;
  title?: string | null;
  description?: string | null;
  disabled?: boolean;
  placeholder?: string;
  helperText?: string | null;
  className?: string;
  id?: string;
};

const defaultHelperText =
  "Choisissez dans la liste ou saisissez une catégorie puis validez avec une virgule.";

function toComboboxGroups(groups: GroupedCategoryFilterOptions) {
  return groups
    .filter((group) => group.options.length > 0)
    .map((group) => ({
      value: group.groupLabel || "Autres",
      items: group.options.map((option) => option.value),
    }));
}

function addTags(current: string[], ...candidates: string[]) {
  const next = [...current];

  for (const candidate of candidates) {
    const tag = candidate.trim();
    if (!tag || next.includes(tag)) {
      continue;
    }
    next.push(tag);
  }

  return next;
}

export function EventCategoryTagsInput({
  value,
  onChange,
  groups: groupsProp,
  title,
  description,
  disabled = false,
  placeholder = "Ajouter une catégorie…",
  helperText = defaultHelperText,
  className,
  id,
}: EventCategoryTagsInputProps) {
  const anchor = useComboboxAnchor();
  const { data: loadedOptions } = useEventCategoryTagOptions({
    enabled: !groupsProp,
  });
  const groups = groupsProp ?? loadedOptions?.categoryGroups ?? [];
  const aliasesByTag = loadedOptions?.aliasesByTag ?? {};
  const comboboxGroups = useMemo(() => toComboboxGroups(groups), [groups]);
  const candidateTags = useMemo(
    () =>
      flattenGroupedCategoryFilterOptions(groups).map((option) => option.value),
    [groups],
  );
  const suggestedTags = useMemo(
    () =>
      title === undefined && description === undefined
        ? []
        : suggestCategoryTagsFromText({
            title,
            description,
            candidateTags,
            selectedTags: value,
            aliasesByTag,
          }),
    [title, description, candidateTags, value, aliasesByTag],
  );
  const [inputValue, setInputValue] = useState("");
  const [open, setOpen] = useState(false);

  function commitInput(raw: string) {
    const parts = raw
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);

    if (parts.length === 0) {
      setInputValue("");
      return;
    }

    onChange(addTags(value, ...parts));
    setInputValue("");
  }

  function handleInputKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (disabled) {
      return;
    }

    if (event.key === ",") {
      event.preventDefault();
      commitInput(inputValue);
      return;
    }

    if (event.key === "Enter" && !open && inputValue.trim()) {
      event.preventDefault();
      commitInput(inputValue);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Combobox
        multiple
        autoHighlight
        disabled={disabled}
        items={comboboxGroups}
        value={value}
        onValueChange={(nextValue) => onChange(nextValue ?? [])}
        inputValue={inputValue}
        onInputValueChange={setInputValue}
        open={open}
        onOpenChange={setOpen}
        isItemEqualToValue={(item, selected) => item === selected}
      >
      <ComboboxChips ref={anchor} className={cn("w-full", className)}>
        <ComboboxValue>
          {(values) => (
            <>
              {values.map((tag: string) => (
                <ComboboxChip key={tag}>{tag}</ComboboxChip>
              ))}
              <ComboboxChipsInput
                id={id}
                placeholder={values.length === 0 ? placeholder : undefined}
                onKeyDown={handleInputKeyDown}
              />
            </>
          )}
        </ComboboxValue>
      </ComboboxChips>
      <ComboboxContent
        anchor={anchor}
        className="w-auto min-w-56 max-w-72 data-[chips=true]:min-w-56"
      >
        <ComboboxEmpty>Aucune catégorie trouvée.</ComboboxEmpty>
        <ComboboxList>
          {(group, index) => (
            <ComboboxGroup key={group.value} items={group.items}>
              <ComboboxLabel>{group.value}</ComboboxLabel>
              <ComboboxCollection>
                {(item) => {
                  const selected = value.includes(item);

                  return (
                    <ComboboxItem
                      key={item}
                      value={item}
                      className="group/combobox-item px-2 [&>span.absolute]:hidden"
                    >
                      <span
                        data-slot="category-tag-checkbox"
                        data-selected={selected ? "" : undefined}
                        aria-hidden
                        className={cn(
                          "pointer-events-none flex size-4 shrink-0 items-center justify-center rounded-sm border border-input bg-background group-data-highlighted/combobox-item:border-input group-data-highlighted/combobox-item:bg-background",
                          selected &&
                            "border-primary bg-primary group-data-highlighted/combobox-item:border-primary group-data-highlighted/combobox-item:bg-primary",
                        )}
                      >
                        {selected ? (
                          <Check
                            className="size-3 shrink-0"
                            color="var(--primary-foreground)"
                          />
                        ) : null}
                      </span>
                      <span className="min-w-0 truncate">{item}</span>
                    </ComboboxItem>
                  );
                }}
              </ComboboxCollection>
              {index < comboboxGroups.length - 1 ? <ComboboxSeparator /> : null}
            </ComboboxGroup>
          )}
        </ComboboxList>
      </ComboboxContent>
      </Combobox>
      {helperText ? (
        <p className="text-muted-foreground text-xs">{helperText}</p>
      ) : null}
      {suggestedTags.length > 0 ? (
        <div className="flex flex-col gap-1.5">
          <span className="text-muted-foreground text-xs font-medium">
            Tags suggérés
          </span>
          <div className="flex flex-wrap gap-1.5">
            {suggestedTags.map((tag) => (
              <Button
                key={tag}
                type="button"
                variant="outline"
                size="xs"
                disabled={disabled}
                onClick={() => onChange(addTags(value, tag))}
              >
                <Plus data-icon="inline-start" />
                {tag}
              </Button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
