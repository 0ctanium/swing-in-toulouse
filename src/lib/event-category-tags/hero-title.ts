export type DanceHeroTitleFields = {
  heroTitleBefore: string | null;
  heroTitleEmphasis: string | null;
  heroTitleAfter: string | null;
};

export const DEFAULT_DANCE_HERO_TITLE_BEFORE = "Où danser le";
export const DEFAULT_DANCE_HERO_TITLE_AFTER = "à Toulouse ?";

export function resolveDanceHeroTitle(
  name: string,
  fields: Partial<DanceHeroTitleFields>,
) {
  return {
    before: fields.heroTitleBefore ?? DEFAULT_DANCE_HERO_TITLE_BEFORE,
    emphasis: fields.heroTitleEmphasis ?? name,
    after: fields.heroTitleAfter ?? DEFAULT_DANCE_HERO_TITLE_AFTER,
  };
}

/** Plain-text title for SEO, cards, breadcrumbs fallback. */
export function formatDanceHeroTitlePlain(
  name: string,
  fields: Partial<DanceHeroTitleFields>,
) {
  const { before, emphasis, after } = resolveDanceHeroTitle(name, fields);
  return [before, emphasis, after].filter(Boolean).join(" ");
}
