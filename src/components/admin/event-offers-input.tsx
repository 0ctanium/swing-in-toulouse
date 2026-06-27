"use client";

import { Plus, X } from "lucide-react";
import { useId, useMemo } from "react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  buildOffersOverridePatch,
  createEmptyOfferDraft,
  type EventOffer,
  type EventOfferDraft,
  type EventOffersMode,
  resolveOffersFormState,
} from "@/lib/events/offers";
import type { EventOverridePatch } from "@/lib/events/overrides.types";
import { cn } from "@/lib/utils";

const OFFER_MODE_OPTIONS: Array<{
  value: EventOffersMode;
  label: string;
  hint?: string;
}> = [
  { value: "unset", label: "N/D", hint: "Aucune offre dans le JSON-LD." },
  {
    value: "free",
    label: "Gratuit",
    hint: "Affiché comme 0 € dans le JSON-LD.",
  },
  { value: "single", label: "Tarif unique" },
  { value: "multiple", label: "Plusieurs tarifs" },
];

const INPUT_CLASS =
  "h-10 w-full rounded-lg border bg-background px-3 py-2 text-sm";

type EventOffersInputProps = {
  mode: EventOffersMode;
  rows: EventOfferDraft[];
  onModeChange: (mode: EventOffersMode) => void;
  onRowsChange: (rows: EventOfferDraft[]) => void;
  disabled?: boolean;
};

export function resolveInitialOffersFormState(options: {
  currentPatchOffers: EventOffer[] | null | undefined;
  syncedOffers: EventOffer[] | null | undefined;
}) {
  return resolveOffersFormState(options);
}

export function buildOffersPatchFromForm(options: {
  mode: EventOffersMode;
  rows: EventOfferDraft[];
  syncedOffers: EventOffer[] | null;
  currentPatchOffers: EventOffer[] | null | undefined;
}): Pick<EventOverridePatch, "offers"> {
  return buildOffersOverridePatch(options);
}

function emptyMultipleRow(): EventOfferDraft {
  return { label: "", price: "" };
}

export function EventOffersInput({
  mode,
  rows,
  onModeChange,
  onRowsChange,
  disabled = false,
}: EventOffersInputProps) {
  const groupName = useId();
  const showPriceRows = mode === "single" || mode === "multiple";
  const activeHint = OFFER_MODE_OPTIONS.find((option) => option.value === mode)
    ?.hint;

  const rowErrors = useMemo(() => {
    if (!showPriceRows) {
      return [];
    }

    return rows.map((row) => {
      const price = Number.parseFloat(row.price.replace(",", "."));

      if (!row.price.trim()) {
        return "Prix requis";
      }

      if (!Number.isFinite(price) || price < 0) {
        return "Prix invalide";
      }

      return null;
    });
  }, [rows, showPriceRows]);

  function updateRow(index: number, patch: Partial<EventOfferDraft>) {
    onRowsChange(
      rows.map((row, rowIndex) =>
        rowIndex === index ? { ...row, ...patch } : row,
      ),
    );
  }

  function addRow() {
    onRowsChange([...rows, emptyMultipleRow()]);
  }

  function removeRow(index: number) {
    if (rows.length <= 1) {
      return;
    }

    onRowsChange(rows.filter((_, rowIndex) => rowIndex !== index));
  }

  function handleModeChange(nextMode: EventOffersMode) {
    onModeChange(nextMode);

    if (nextMode === "single" && rows.length === 0) {
      onRowsChange([createEmptyOfferDraft()]);
      return;
    }

    if (nextMode === "multiple" && rows.length < 2) {
      onRowsChange([
        rows[0]?.price || rows[0]?.label
          ? { ...rows[0], label: rows[0].label || "" }
          : emptyMultipleRow(),
        emptyMultipleRow(),
      ]);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <fieldset disabled={disabled} className="flex flex-col gap-2">
        <legend className="sr-only">Type de tarification</legend>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          {OFFER_MODE_OPTIONS.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-center gap-2 text-sm"
            >
              <input
                type="radio"
                name={groupName}
                className="size-4 accent-primary"
                checked={mode === option.value}
                onChange={() => handleModeChange(option.value)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {activeHint ? (
        <p className="text-muted-foreground text-xs">{activeHint}</p>
      ) : null}

      {mode === "single" ? (
        <div className="flex max-w-xs flex-col gap-1.5">
          <Label htmlFor={`${groupName}-single-price`}>Prix</Label>
          <div className="relative">
            <input
              id={`${groupName}-single-price`}
              className={cn(INPUT_CLASS, "pr-8")}
              inputMode="decimal"
              placeholder="Ex. 12"
              value={rows[0]?.price ?? ""}
              disabled={disabled}
              onChange={(event) =>
                updateRow(0, { price: event.target.value })
              }
            />
            <span className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm">
              €
            </span>
          </div>
          {rowErrors[0] ? (
            <span className="text-destructive text-xs">{rowErrors[0]}</span>
          ) : null}
        </div>
      ) : null}

      {mode === "multiple" ? (
        <div className="flex flex-col gap-2">
          <div className="overflow-x-auto">
            <div className="min-w-md flex flex-col gap-2">
              <div className="grid grid-cols-[minmax(0,1fr)_7.5rem_2.25rem] items-end gap-2 px-0.5">
                <Label className="text-muted-foreground text-xs font-normal">
                  Libellé
                </Label>
                <Label className="text-muted-foreground text-xs font-normal">
                  Prix
                </Label>
                <span className="sr-only">Retirer</span>
              </div>

              {rows.map((row, index) => (
                <div
                  key={index}
                  className="grid grid-cols-[minmax(0,1fr)_7.5rem_2.25rem] items-start gap-2"
                >
                  <input
                    className={INPUT_CLASS}
                    placeholder="Ex. 1h, Pass journée"
                    value={row.label}
                    disabled={disabled}
                    aria-label={`Libellé du tarif ${index + 1}`}
                    onChange={(event) =>
                      updateRow(index, { label: event.target.value })
                    }
                  />

                  <div className="flex flex-col gap-1">
                    <div className="relative">
                      <input
                        className={cn(INPUT_CLASS, "pr-8")}
                        inputMode="decimal"
                        placeholder="0"
                        value={row.price}
                        disabled={disabled}
                        aria-label={`Prix du tarif ${index + 1}`}
                        onChange={(event) =>
                          updateRow(index, { price: event.target.value })
                        }
                      />
                      <span className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm">
                        €
                      </span>
                    </div>
                    {rowErrors[index] ? (
                      <span className="text-destructive text-xs">
                        {rowErrors[index]}
                      </span>
                    ) : null}
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="mt-1 shrink-0"
                    disabled={disabled || rows.length <= 1}
                    aria-label={`Retirer le tarif ${index + 1}`}
                    onClick={() => removeRow(index)}
                  >
                    <X />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-fit"
            disabled={disabled}
            onClick={addRow}
          >
            <Plus data-icon="inline-start" />
            Ajouter un tarif
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export function offersFormIsValid(mode: EventOffersMode, rows: EventOfferDraft[]) {
  if (mode === "unset" || mode === "free") {
    return true;
  }

  return rows.every((row) => {
    const price = Number.parseFloat(row.price.replace(",", "."));
    return row.price.trim() !== "" && Number.isFinite(price) && price >= 0;
  });
}
