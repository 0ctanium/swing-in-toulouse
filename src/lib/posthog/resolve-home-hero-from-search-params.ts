import { parseHeroArtVariant } from "@/components/home/heroes/hero-art/types";
import { parseHeroVariant } from "@/components/home/heroes/types";
import type { HomeHeroAssignment } from "@/lib/posthog/get-home-hero-assignment";
import {
  DEFAULT_HOME_HERO_ART,
  DEFAULT_HOME_HERO_LAYOUT,
} from "@/lib/posthog/home-hero";
import type { ParsedHomeHeroSearchParams } from "@/lib/posthog/parse-home-hero-search-params";

export function resolveHomeHeroFromSearchParams(
  params: Pick<ParsedHomeHeroSearchParams, "hero" | "art">,
  distinctId: string,
): HomeHeroAssignment | null {
  if (params.hero == null && params.art == null) {
    return null;
  }

  const layout =
    params.hero != null ? parseHeroVariant(params.hero) : DEFAULT_HOME_HERO_LAYOUT;
  const art =
    params.art != null ? parseHeroArtVariant(params.art) : DEFAULT_HOME_HERO_ART;

  return {
    layout,
    art: layout === "a" ? art : DEFAULT_HOME_HERO_ART,
    flagVariant: null,
    distinctId,
  };
}
