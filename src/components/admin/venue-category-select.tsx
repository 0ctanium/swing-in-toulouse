"use client";

import { toast } from "sonner";

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
    <select
      className="rounded-lg border bg-background px-3 py-2 text-sm"
      value={value ?? ""}
      disabled={disabled || pending}
      onChange={(event) => handleChange(event.target.value)}
    >
      <option value="">— Non catégorisé —</option>
      {venueCategoryOptions().map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
