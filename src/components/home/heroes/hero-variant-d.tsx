import { homeHero } from "@/lib/content/swing-dances";
import { organizationDanceValues } from "@/lib/organizations/dances";

import { HeroActions, type HeroExperimentTracking } from "./hero-shared";

export function HeroVariantD({
  heroLayoutVariant,
  flagVariant,
}: HeroExperimentTracking) {
  return (
    <section
      aria-labelledby="home-hero-heading"
      className="overflow-hidden rounded-3xl border md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]"
    >
      <div className="bg-primary text-primary-foreground relative px-6 py-10 md:px-10 md:py-12">
        <div
          className="bg-primary absolute top-0 -right-px hidden h-full w-10 [clip-path:polygon(0_0,100%_0,0_100%)] md:block"
          aria-hidden
        />

        <div className="relative flex max-w-md flex-col gap-4">
          <p className="text-primary-foreground/75 text-sm font-medium tracking-wide">
            {homeHero.kicker}
          </p>
          <h1
            id="home-hero-heading"
            className="font-heading text-4xl leading-[1.05] font-semibold tracking-tight md:text-5xl"
          >
            La scène swing toulousaine,{" "}
            <span className="text-accent italic">réunie</span>.
          </h1>
        </div>
      </div>

      <div className="bg-background flex flex-col gap-5 px-6 py-10 md:px-10 md:py-12">
        <p className="text-muted-foreground text-sm leading-relaxed md:text-base">
          {homeHero.lead}
        </p>

        <p className="text-foreground/85 text-sm leading-relaxed">
          {homeHero.followUp}
        </p>

        <p className="text-muted-foreground text-xs leading-relaxed">
          {organizationDanceValues.join(" · ")}
        </p>

        <HeroActions
          heroLayoutVariant={heroLayoutVariant}
          flagVariant={flagVariant}
        />
      </div>
    </section>
  );
}
