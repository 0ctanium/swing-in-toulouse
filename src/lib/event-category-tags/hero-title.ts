export type DanceHeroTitleFields = {
  heroTitleBefore: string | null;
  heroTitleEmphasis: string | null;
  heroTitleAfter: string | null;
};

export const DEFAULT_DANCE_HERO_TITLE_BEFORE = "Où danser le";
export const DEFAULT_DANCE_HERO_TITLE_AFTER = "à Toulouse ?";

export type ResolvedHeroTitle = {
  before: string;
  emphasis: string;
  after: string;
};

export function isHeroTitleCustomized(
  fields: Partial<DanceHeroTitleFields>,
): boolean {
  return (
    fields.heroTitleBefore !== null &&
    fields.heroTitleBefore !== undefined
  ) || (
    fields.heroTitleEmphasis !== null &&
    fields.heroTitleEmphasis !== undefined
  ) || (
    fields.heroTitleAfter !== null &&
    fields.heroTitleAfter !== undefined
  );
}

export function resolveDanceHeroTitle(
  name: string,
  fields: Partial<DanceHeroTitleFields>,
): ResolvedHeroTitle {
  if (!isHeroTitleCustomized(fields)) {
    return {
      before: DEFAULT_DANCE_HERO_TITLE_BEFORE,
      emphasis: name,
      after: DEFAULT_DANCE_HERO_TITLE_AFTER,
    };
  }

  return {
    before: fields.heroTitleBefore ?? "",
    emphasis: fields.heroTitleEmphasis ?? name,
    after: fields.heroTitleAfter ?? "",
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

export function shouldRenderHeroTitleAfterInline(
  before: string,
  after: string,
) {
  const trimmedAfter = after.trim();

  if (!trimmedAfter) {
    return false;
  }

  return !before.trim();
}
