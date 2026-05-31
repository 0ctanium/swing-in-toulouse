export const heroArtVariants = ["vinyl", "scene"] as const;

export type HeroArtVariant = (typeof heroArtVariants)[number];

export const heroArtLabels: Record<
  HeroArtVariant,
  { name: string; hint: string }
> = {
  vinyl: { name: "Vinyle", hint: "Disque · micro · jazz club" },
  scene: { name: "Scène", hint: "Piano · paillettes · live" },
};

export function parseHeroArtVariant(value: string | undefined): HeroArtVariant {
  if (value === "scene" || value === "deco") {
    return "scene";
  }

  if (value === "vinyl") {
    return "vinyl";
  }

  return "vinyl";
}
