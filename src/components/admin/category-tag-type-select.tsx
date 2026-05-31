"use client";

import { toast } from "sonner";

import { EntitySelect } from "@/components/ui/entity-select";
import { useUpdateCategoryTagMetadata } from "@/lib/admin/use-category-tags";
import type { EventCategoryTagType } from "@/db/schema";
import { eventCategoryTagTypeOptions } from "@/lib/event-category-tags/tag-types";

type CategoryTagTypeSelectProps = {
  name: string;
  value: EventCategoryTagType;
  disabled?: boolean;
};

export function CategoryTagTypeSelect({
  name,
  value,
  disabled = false,
}: CategoryTagTypeSelectProps) {
  const updateMetadata = useUpdateCategoryTagMetadata();
  const pending = updateMetadata.isPending;

  async function handleChange(nextValue: string) {
    const tagType = nextValue as EventCategoryTagType;

    if (tagType === value) {
      return;
    }

    try {
      await updateMetadata.mutateAsync({ name, tagType });
      toast.success("Type enregistré.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Enregistrement impossible.",
      );
    }
  }

  return (
    <EntitySelect
      value={value}
      onChange={handleChange}
      disabled={disabled || pending}
      placeholder="Choisir un type…"
      options={eventCategoryTagTypeOptions().map((option) => ({
        value: option.value,
        label: option.label,
      }))}
      triggerClassName="h-8"
    />
  );
}
