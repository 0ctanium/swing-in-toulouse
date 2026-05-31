import Link from "next/link";

import { cn } from "@/lib/utils";

import { buildHeroPreviewHref } from "../build-hero-preview-href";
import {
  heroArtLabels,
  heroArtVariants,
  type HeroArtVariant,
} from "./types";

type HeroArtPickerProps = {
  active: HeroArtVariant;
  heroVariant: string;
};

export function HeroArtPicker({ active, heroVariant }: HeroArtPickerProps) {
  return (
    <div className="border-border/80 bg-background/80 flex flex-col gap-2 rounded-lg border px-3 py-2">
      <p className="text-muted-foreground text-xs">
        Illustration — finale entre :
      </p>
      <div className="flex flex-wrap gap-1.5">
        {heroArtVariants.map((art) => {
          const { name, hint } = heroArtLabels[art];
          const isActive = art === active;

          return (
            <Link
              key={art}
              href={buildHeroPreviewHref({
                hero: heroVariant as "a",
                art,
                preview: true,
              })}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors",
                isActive
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:border-primary/30 bg-background",
              )}
              aria-current={isActive ? "true" : undefined}
            >
              <span className="font-medium">{name}</span>
              <span className={isActive ? "opacity-80" : "opacity-70"}>
                {hint}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
