"use client";

import { useMemo } from "react";

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { cn } from "@/lib/utils";

export type EntitySelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type EntitySelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: EntitySelectOption[];
  placeholder?: string;
  allowEmpty?: boolean;
  emptyLabel?: string;
  disabled?: boolean;
  triggerClassName?: string;
  contentClassName?: string;
  renderOption?: (option: EntitySelectOption) => React.ReactNode;
};

function buildOptionList(
  options: EntitySelectOption[],
  allowEmpty: boolean,
  emptyLabel: string,
) {
  if (!allowEmpty) {
    return options;
  }

  return [{ value: "", label: emptyLabel }, ...options];
}

export function EntitySelect({
  value,
  onChange,
  options,
  placeholder = "Choisir…",
  allowEmpty = false,
  emptyLabel = "- Aucun -",
  disabled = false,
  triggerClassName,
  contentClassName,
  renderOption,
}: EntitySelectProps) {
  const items = useMemo(
    () => buildOptionList(options, allowEmpty, emptyLabel),
    [options, allowEmpty, emptyLabel],
  );

  const selectedItem = useMemo(
    () => items.find((item) => item.value === value) ?? null,
    [items, value],
  );

  return (
    <Combobox
      items={items}
      disabled={disabled}
      value={selectedItem}
      onValueChange={(item) => onChange(item?.value ?? "")}
      isItemEqualToValue={(item, selected) => item.value === selected.value}
      itemToStringLabel={(item) => item.label}
    >
      <ComboboxInput
        placeholder={placeholder}
        className={cn("w-full", triggerClassName)}
        showClear={allowEmpty && Boolean(value)}
        disabled={disabled}
      />
      <ComboboxContent className={contentClassName}>
        <ComboboxEmpty>Aucun résultat.</ComboboxEmpty>
        <ComboboxList>
          {(item) => (
            <ComboboxItem
              key={item.value || "__empty__"}
              value={item}
              disabled={item.disabled}
            >
              {renderOption ? renderOption(item) : item.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
