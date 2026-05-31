import Link from "next/link";

import { cn } from "@/lib/utils";

import { buildHeroPreviewHref } from "./build-hero-preview-href";
import { HeroArtPicker } from "./hero-art/hero-art-picker";
import type { HeroArtVariant } from "./hero-art/types";
import {
  heroVariantLabels,
  heroVariants,
  type HeroVariant,
} from "./types";

type HeroVariantPickerProps = {
  active: HeroVariant;
  art?: HeroArtVariant;
};

export function HeroVariantPicker({ active, art = "vinyl" }: HeroVariantPickerProps) {
  return (
    <div className="border-primary/20 bg-muted/50 flex flex-col gap-3 rounded-xl border border-dashed px-4 py-3">
      <div className="flex flex-col gap-2">
        <p className="text-muted-foreground text-xs">
          Choix de hero en cours — cliquez pour comparer :
        </p>
        <div className="flex flex-wrap gap-2">
          {heroVariants.map((variant) => {
            const { name, hint } = heroVariantLabels[variant];
            const isActive = variant === active;

            return (
              <Link
                key={variant}
                href={buildHeroPreviewHref({
                  hero: variant,
                  art: variant === "a" ? art : undefined,
                  preview: true,
                })}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors",
                  isActive
                    ? "border-primary bg-primary text-primary-foreground"
                    : "bg-background text-foreground hover:border-primary/40 hover:bg-background/80",
                )}
                aria-current={isActive ? "true" : undefined}
              >
                <span className="font-semibold">{name}</span>
                <span
                  className={cn(
                    "text-xs",
                    isActive ? "opacity-90" : "text-muted-foreground",
                  )}
                >
                  {hint}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {active === "a" ? <HeroArtPicker active={art} heroVariant={active} /> : null}
    </div>
  );
}
