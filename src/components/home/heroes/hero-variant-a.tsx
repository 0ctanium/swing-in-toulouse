import { homeHero } from "@/lib/content/swing-dances";

import { HeroArt } from "./hero-art/hero-art";
import type { HeroArtVariant } from "./hero-art/types";
import {
  HeroActions,
  HeroDanceChips,
  type HeroExperimentTracking,
} from "./hero-shared";

type HeroVariantAProps = HeroExperimentTracking & {
  art?: HeroArtVariant;
};

export function HeroVariantA({
  art = "vinyl",
  heroLayoutVariant,
  heroArtVariant,
  flagVariant,
}: HeroVariantAProps) {
  return (
    <section
      aria-labelledby="home-hero-heading"
      className="relative overflow-hidden rounded-3xl border bg-linear-to-br from-secondary/80 via-background to-accent/15 px-6 py-10 shadow-sm md:min-h-[22rem] md:px-10 md:py-14"
    >
      <HeroArt variant={art} />

      <div className="relative flex max-w-2xl flex-col gap-6">
        <div className="flex flex-col gap-2">
          <p className="text-primary text-sm font-medium tracking-wide">
            {homeHero.kicker}
          </p>
          <h1
            id="home-hero-heading"
            className="font-heading text-4xl leading-[1.05] font-semibold tracking-tight md:text-5xl lg:text-[3.25rem]"
          >
            {homeHero.title[0]}
            <span className="text-primary block">{homeHero.title[1]}</span>
          </h1>
        </div>

        <p className="text-muted-foreground max-w-xl text-base leading-relaxed md:text-lg">
          {homeHero.lead}
        </p>

        <HeroDanceChips />

        <p className="text-foreground/85 max-w-lg text-sm leading-relaxed">
          {homeHero.followUp}
        </p>

        <HeroActions
          className="flex flex-wrap gap-3 pt-1"
          heroLayoutVariant={heroLayoutVariant}
          heroArtVariant={heroArtVariant ?? art}
          flagVariant={flagVariant}
        />
      </div>
    </section>
  );
}
