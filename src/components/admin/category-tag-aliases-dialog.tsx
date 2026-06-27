"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useUpdateCategoryTagAliases } from "@/lib/admin/use-category-tags";
import type { AdminCategoryTagRow } from "@/lib/event-category-tags/admin";
import { cn } from "@/lib/utils";

type CategoryTagAliasesDialogProps = {
  row: AdminCategoryTagRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function addAlias(current: string[], candidate: string) {
  const trimmed = candidate.trim();
  if (!trimmed) {
    return current;
  }

  const exists = current.some(
    (alias) => alias.localeCompare(trimmed, "fr", { sensitivity: "accent" }) === 0,
  );

  if (exists) {
    return current;
  }

  return [...current, trimmed];
}

function AliasesEditor({
  value,
  onChange,
  disabled = false,
}: {
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState("");

  function commitDraft(raw: string) {
    const parts = raw
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);

    if (parts.length === 0) {
      setDraft("");
      return;
    }

    let next = value;
    for (const part of parts) {
      next = addAlias(next, part);
    }
    onChange(next);
    setDraft("");
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        className={cn(
          "flex min-h-8 flex-wrap items-center gap-1 rounded-lg border border-input bg-transparent bg-clip-padding px-2.5 py-1 text-sm transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
          disabled && "opacity-50",
        )}
      >
        {value.map((alias) => (
          <span
            key={alias}
            className="flex h-[calc(--spacing(5.25))] w-fit items-center gap-1 rounded-sm bg-muted px-1.5 text-xs font-medium whitespace-nowrap text-foreground"
          >
            {alias}
            <button
              type="button"
              className="-ml-1 opacity-50 hover:opacity-100"
              disabled={disabled}
              aria-label={`Retirer ${alias}`}
              onClick={() => onChange(value.filter((item) => item !== alias))}
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={draft}
          disabled={disabled}
          placeholder={value.length === 0 ? "Atelier, Workshop…" : undefined}
          className="min-w-16 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === ",") {
              event.preventDefault();
              commitDraft(draft);
              return;
            }

            if (event.key === "Enter") {
              event.preventDefault();
              commitDraft(draft);
            }
          }}
          onBlur={() => {
            if (draft.trim()) {
              commitDraft(draft);
            }
          }}
        />
      </div>
      <p className="text-muted-foreground text-xs">
        Saisissez un alias puis validez avec une virgule ou Entrée.
      </p>
    </div>
  );
}

export function CategoryTagAliasesDialog({
  row,
  open,
  onOpenChange,
}: CategoryTagAliasesDialogProps) {
  const updateAliases = useUpdateCategoryTagAliases();
  const [aliases, setAliases] = useState(row.aliases);
  const pending = updateAliases.isPending;

  function resetForm() {
    setAliases(row.aliases);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    try {
      await updateAliases.mutateAsync({
        name: row.name,
        aliases,
      });
      toast.success("Alias enregistrés.");
      onOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Enregistrement impossible.",
      );
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          resetForm();
        }
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Alias — {row.name}</DialogTitle>
            <DialogDescription>
              Mots ou expressions reconnus dans le titre ou la description pour
              suggérer le tag « {row.name} » lors de la confirmation
              d&apos;événements.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <Label>Alias</Label>
            <AliasesEditor
              value={aliases}
              onChange={setAliases}
              disabled={pending}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
