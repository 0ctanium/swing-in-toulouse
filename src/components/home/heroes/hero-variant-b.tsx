import { homeHero } from "@/lib/content/swing-dances";

import {
  HeroActions,
  HeroDanceChips,
  type HeroExperimentTracking,
} from "./hero-shared";

export function HeroVariantB({
  heroLayoutVariant,
  flagVariant,
}: HeroExperimentTracking) {
  return (
    <section
      aria-labelledby="home-hero-heading"
      className="border-primary/20 flex flex-col gap-8 border-l-4 py-2 pl-6 md:pl-8"
    >
      <div className="flex max-w-2xl flex-col gap-5">
        <h1
          id="home-hero-heading"
          className="font-heading text-4xl leading-[1.08] font-semibold tracking-tight md:text-[2.75rem] lg:text-5xl"
        >
          Où danser le swing
          <span className="text-primary block">à Toulouse ?</span>
        </h1>

        <p className="text-muted-foreground max-w-xl text-base leading-relaxed md:text-lg">
          {homeHero.lead}
        </p>

        <HeroDanceChips variant="inline" />

        <p className="text-foreground/80 max-w-lg text-sm leading-relaxed">
          {homeHero.followUp}
        </p>
      </div>

      <HeroActions
        heroLayoutVariant={heroLayoutVariant}
        flagVariant={flagVariant}
      />
    </section>
  );
}
