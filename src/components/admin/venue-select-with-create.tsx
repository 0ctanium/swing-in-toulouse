"use client";

import { Plus } from "lucide-react";
import { useState } from "react";

import { VenueFormDialog } from "@/components/admin/venue-form-dialog";
import { VenueSelect, type VenueSelectOption } from "@/components/admin/venue-select";
import { Button } from "@/components/ui/button";
import type { Venue } from "@/db/schema";
import type { VenueMatchCandidate } from "@/lib/venues/match-candidates";
import { toVenueSelectOption } from "@/lib/venues/select-options";

type VenueSelectWithCreateProps = {
  venues: VenueSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyLabel?: string;
  disabled?: boolean;
  excludeIds?: string[];
  allowEmpty?: boolean;
  onVenueCreated?: (venue: VenueSelectOption) => void;
};

export function VenueSelectWithCreate({
  onVenueCreated,
  disabled = false,
  ...selectProps
}: VenueSelectWithCreateProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  function handleCreated(venue: Venue) {
    const option = toVenueSelectOption(venue);
    onVenueCreated?.(option);
    selectProps.onChange(option.id);
  }

  return (
    <>
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <VenueSelect {...selectProps} disabled={disabled} />
        </div>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          onClick={() => setDialogOpen(true)}
        >
          <Plus data-icon="inline-start" />
          Nouveau lieu
        </Button>
      </div>

      <VenueFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        venue={null}
        onCreated={handleCreated}
      />
    </>
  );
}

export function mergeVenueSelectOptions(
  venues: readonly VenueSelectOption[],
  createdVenues: readonly VenueSelectOption[],
) {
  const byId = new Map(venues.map((venue) => [venue.id, venue]));

  for (const venue of createdVenues) {
    byId.set(venue.id, venue);
  }

  return [...byId.values()].sort((left, right) =>
    left.name.localeCompare(right.name, "fr"),
  );
}

export function appendCreatedVenueOption(
  createdVenues: readonly VenueSelectOption[],
  venue: VenueSelectOption,
) {
  return [...createdVenues.filter((entry) => entry.id !== venue.id), venue];
}

export function mergeVenueMatchCandidates(
  candidates: readonly VenueMatchCandidate[],
  createdVenues: readonly VenueSelectOption[],
) {
  const byId = new Map(candidates.map((candidate) => [candidate.id, candidate]));

  for (const venue of createdVenues) {
    byId.set(venue.id, { id: venue.id, names: [venue.name] });
  }

  return [...byId.values()];
}
