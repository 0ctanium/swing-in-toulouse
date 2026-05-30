"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { isVenueAddressConfirmed } from "@/lib/venues/confirmation";
import type { VenueWithStats } from "@/lib/venues/matching";

type VenuePickerProps = {
  venues: VenueWithStats[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  excludeIds?: string[];
};

function venueAddressLine(venue: VenueWithStats) {
  if (venue.formattedAddress) {
    return venue.formattedAddress;
  }

  if (venue.address) {
    return venue.address;
  }

  return "Adresse iCal incomplète";
}

function VenueOptionDetails({ venue }: { venue: VenueWithStats }) {
  const confirmed = isVenueAddressConfirmed(venue);

  return (
    <div className="flex min-w-0 flex-col gap-0.5 py-0.5">
      <span className="font-medium">{venue.name}</span>
      <span className="text-muted-foreground text-xs">
        {venue.eventCount} événement{venue.eventCount > 1 ? "s" : ""} ·{" "}
        {confirmed ? "Google confirmé" : "Non confirmé"} · /lieu/{venue.slug}
      </span>
      <span className="text-muted-foreground text-xs">{venueAddressLine(venue)}</span>
      {venue.canonicalVenueName ? (
        <span className="text-xs text-amber-800 dark:text-amber-200">
          Alias → {venue.canonicalVenueName}
        </span>
      ) : null}
      {venue.aliasCount > 0 ? (
        <span className="text-muted-foreground text-xs">
          {venue.aliasCount} alias permanent{venue.aliasCount > 1 ? "s" : ""}
        </span>
      ) : null}
    </div>
  );
}

export function VenuePicker({
  venues,
  value,
  onChange,
  placeholder = "Choisir un lieu…",
  disabled = false,
  excludeIds = [],
}: VenuePickerProps) {
  const excluded = new Set(excludeIds);
  const options = venues.filter((venue) => !excluded.has(venue.id));
  const selected = options.find((venue) => venue.id === value);

  return (
    <Select
      value={value || null}
      onValueChange={(nextValue) => onChange(nextValue ?? "")}
      disabled={disabled}
    >
      <SelectTrigger className="w-full" size="default">
        <SelectValue placeholder={placeholder}>
          {selected ? (
            <span className="truncate">{selected.name}</span>
          ) : null}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="max-w-[min(100vw-2rem,32rem)]">
        {options.map((venue) => (
          <SelectItem key={venue.id} value={venue.id}>
            <VenueOptionDetails venue={venue} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function VenueAliasBadge({ venue }: { venue: VenueWithStats }) {
  if (venue.canonicalVenueName) {
    return (
      <span className="inline-flex w-fit rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-950 dark:text-amber-100">
        Alias → {venue.canonicalVenueName}
      </span>
    );
  }

  if (venue.aliasCount > 0) {
    return (
      <span className="text-muted-foreground text-xs">
        Principal · {venue.aliasCount} alias
      </span>
    );
  }

  return null;
}
