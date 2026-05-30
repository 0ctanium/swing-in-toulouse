"use client";

import { EntitySelect } from "@/components/ui/entity-select";

export type OrganizationSelectOption = {
  id: string;
  name: string;
};

type OrganizationSelectProps = {
  organizations: OrganizationSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyLabel?: string;
  disabled?: boolean;
};

export function OrganizationSelect({
  organizations,
  value,
  onChange,
  placeholder = "Choisir un organisateur…",
  emptyLabel = "— Aucun —",
  disabled = false,
}: OrganizationSelectProps) {
  return (
    <EntitySelect
      value={value}
      onChange={onChange}
      allowEmpty
      emptyLabel={emptyLabel}
      placeholder={placeholder}
      disabled={disabled}
      options={organizations.map((organization) => ({
        value: organization.id,
        label: organization.name,
      }))}
    />
  );
}
