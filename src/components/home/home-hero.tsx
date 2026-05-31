import { HeroVariantA } from "./heroes/hero-variant-a";
import { HeroVariantB } from "./heroes/hero-variant-b";
import { HeroVariantC } from "./heroes/hero-variant-c";
import { HeroVariantD } from "./heroes/hero-variant-d";
import type { HeroExperimentTracking } from "./heroes/hero-shared";
import { HeroVariantPicker } from "./heroes/hero-variant-picker";
import type { HeroArtVariant } from "./heroes/hero-art/types";
import type { HeroVariant } from "./heroes/types";

type HomeHeroProps = {
  variant?: HeroVariant;
  art?: HeroArtVariant;
  flagVariant?: string | null;
  showPicker?: boolean;
};

function renderHero(
  variant: HeroVariant,
  art: HeroArtVariant,
  tracking: HeroExperimentTracking,
) {
  switch (variant) {
    case "a":
      return <HeroVariantA art={art} {...tracking} />;
    case "b":
      return <HeroVariantB {...tracking} />;
    case "c":
      return <HeroVariantC {...tracking} />;
    case "d":
      return <HeroVariantD {...tracking} />;
  }
}

export function HomeHero({
  variant = "a",
  art = "vinyl",
  flagVariant = null,
  showPicker = false,
}: HomeHeroProps) {
  const tracking: HeroExperimentTracking = {
    heroLayoutVariant: variant,
    heroArtVariant: variant === "a" ? art : undefined,
    flagVariant,
  };

  return (
    <div className="flex flex-col gap-4">
      {showPicker ? <HeroVariantPicker active={variant} art={art} /> : null}
      {renderHero(variant, art, tracking)}
    </div>
  );
}

export type { HeroVariant } from "./heroes/types";
export { parseHeroVariant } from "./heroes/types";
export { parseHeroArtVariant } from "./heroes/hero-art/types";
export type { HeroArtVariant } from "./heroes/hero-art/types";
