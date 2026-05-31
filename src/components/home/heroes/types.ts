export const heroVariants = ["a", "b", "c", "d"] as const;

export type HeroVariant = (typeof heroVariants)[number];

export const heroVariantLabels: Record<
  HeroVariant,
  { name: string; hint: string }
> = {
  a: { name: "A", hint: "Carte chaleureuse" },
  b: { name: "B", hint: "Typo épurée" },
  c: { name: "C", hint: "Aperçu agenda" },
  d: { name: "D", hint: "Découpe diagonale" },
};

export function parseHeroVariant(value: string | undefined): HeroVariant {
  if (value && heroVariants.includes(value as HeroVariant)) {
    return value as HeroVariant;
  }

  return "a";
}
