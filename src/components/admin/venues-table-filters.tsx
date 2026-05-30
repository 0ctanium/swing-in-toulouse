"use client";

import { useQueryStates } from "nuqs";

import { Button } from "@/components/ui/button";
import { EntitySelect } from "@/components/ui/entity-select";
import {
  adminVenuesClientParsers,
  hasAdminVenuesFilters,
  type AdminVenueConfirmationFilter,
} from "@/lib/venues/admin-venues-params";

const CONFIRMATION_OPTIONS = [
  { value: "", label: "Tous les lieux" },
  {
    value: "pending" satisfies AdminVenueConfirmationFilter,
    label: "À confirmer (actifs)",
  },
  {
    value: "confirmed" satisfies AdminVenueConfirmationFilter,
    label: "Adresse confirmée",
  },
];

export function VenuesTableFilters() {
  const [query, setQuery] = useQueryStates(adminVenuesClientParsers, {
    history: "replace",
    shallow: false,
  });

  const activeFilters = hasAdminVenuesFilters(query);

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex min-w-48 flex-1 flex-col gap-1.5 sm:max-w-xs">
        <span className="text-xs font-medium text-muted-foreground">
          Adresse Google
        </span>
        <EntitySelect
          value={query.confirmation ?? ""}
          onChange={(value) =>
            setQuery({
              confirmation:
                value === ""
                  ? null
                  : (value as AdminVenueConfirmationFilter),
            })
          }
          options={CONFIRMATION_OPTIONS}
          placeholder="Tous les lieux"
        />
      </div>

      {activeFilters ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-9"
          onClick={() => setQuery({ confirmation: null })}
        >
          Réinitialiser les filtres
        </Button>
      ) : null}
    </div>
  );
}
