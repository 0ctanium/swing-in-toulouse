"use client";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { NamedEntitySuggestion } from "@/lib/proper-names/match-in-text";

type EntitySuggestionHintsProps = {
  label: string;
  suggestions: readonly NamedEntitySuggestion[];
  onSelect: (id: string) => void;
  disabled?: boolean;
};

export function EntitySuggestionHints({
  label,
  suggestions,
  onSelect,
  disabled = false,
}: EntitySuggestionHintsProps) {
  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-muted-foreground text-xs font-medium">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {suggestions.map((suggestion) => (
          <Button
            key={suggestion.id}
            type="button"
            variant="outline"
            size="xs"
            disabled={disabled}
            onClick={() => onSelect(suggestion.id)}
          >
            <Plus data-icon="inline-start" />
            {suggestion.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
