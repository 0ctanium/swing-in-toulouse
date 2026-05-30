"use client";

import { EntitySelect } from "@/components/ui/entity-select";
import {
  venueAddressLine,
  type VenueSelectOption,
} from "@/lib/venues/select-options";
import { isSelectableVenue } from "@/lib/venues/selectable";

export type { VenueSelectOption };

type VenueSelectProps = {
  venues: VenueSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyLabel?: string;
  disabled?: boolean;
  excludeIds?: string[];
  allowEmpty?: boolean;
};

function VenueOptionDetails({ venue }: { venue: VenueSelectOption }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5 py-0.5">
      <span className="font-medium">{venue.name}</span>
      <span className="text-muted-foreground text-xs">/lieu/{venue.slug}</span>
      <span className="text-muted-foreground text-xs">
        {venueAddressLine(venue)}
      </span>
    </div>
  );
}

export function VenueSelect({
  venues,
  value,
  onChange,
  placeholder = "Choisir un lieu…",
  emptyLabel = "— Aucun —",
  disabled = false,
  excludeIds = [],
  allowEmpty = true,
}: VenueSelectProps) {
  const excluded = new Set(excludeIds);
  const options = venues.filter(
    (venue) => !excluded.has(venue.id) && isSelectableVenue(venue),
  );
  const venueById = new Map(options.map((venue) => [venue.id, venue]));

  return (
    <EntitySelect
      value={value}
      onChange={onChange}
      allowEmpty={allowEmpty}
      emptyLabel={emptyLabel}
      placeholder={placeholder}
      disabled={disabled}
      contentClassName="max-w-[min(100vw-2rem,32rem)]"
      options={options.map((venue) => ({
        value: venue.id,
        label: venue.name,
      }))}
      renderOption={(option) => {
        const venue = venueById.get(option.value);
        return venue ? <VenueOptionDetails venue={venue} /> : option.label;
      }}
    />
  );
}
