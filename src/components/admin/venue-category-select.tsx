"use client";

import { toast } from "sonner";

import { EntitySelect } from "@/components/ui/entity-select";
import { useUpdateVenueCategory } from "@/lib/admin/use-venues";
import type { VenueCategory } from "@/db/schema";
import { venueCategoryOptions } from "@/lib/venues/categories";

type VenueCategorySelectProps = {
  venueId: string;
  value: VenueCategory | null;
  disabled?: boolean;
  onChange?: (value: VenueCategory | null) => void;
  saveOnChange?: boolean;
};

export function VenueCategorySelect({
  venueId,
  value,
  disabled = false,
  onChange,
  saveOnChange = false,
}: VenueCategorySelectProps) {
  const updateCategory = useUpdateVenueCategory();
  const pending = updateCategory.isPending;

  async function handleChange(nextValue: string) {
    const category = nextValue ? (nextValue as VenueCategory) : null;
    onChange?.(category);

    if (!saveOnChange) {
      return;
    }

    try {
      await updateCategory.mutateAsync({ venueId, category });
      toast.success("Catégorie enregistrée.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Enregistrement impossible.",
      );
    }
  }

  return (
    <EntitySelect
      value={value ?? ""}
      onChange={handleChange}
      allowEmpty
      emptyLabel="— Non catégorisé —"
      placeholder="Choisir une catégorie…"
      disabled={disabled || pending}
      options={venueCategoryOptions().map((option) => ({
        value: option.value,
        label: option.label,
      }))}
    />
  );
}
