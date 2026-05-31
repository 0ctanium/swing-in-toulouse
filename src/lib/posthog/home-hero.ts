import type { HeroArtVariant } from "@/components/home/heroes/hero-art/types";
import type { HeroVariant } from "@/components/home/heroes/types";
import { JsonType } from "posthog-js";

export const HOME_HERO_FLAG = "home-hero";

export const DEFAULT_HOME_HERO_LAYOUT: HeroVariant = "a";
export const DEFAULT_HOME_HERO_ART: HeroArtVariant = "vinyl";

export type HomeHeroFlagPayload = {
  variant: HeroVariant;
  illustration?: HeroArtVariant;
};

export type HomeHeroExperimentAssignment = {
  layout: HeroVariant;
  art: HeroArtVariant;
};

function isHeroLayout(value: unknown): value is HeroVariant {
  return value === "a" || value === "b" || value === "c" || value === "d";
}

function isHeroIllustration(value: unknown): value is HeroArtVariant {
  return value === "vinyl" || value === "scene";
}

export function parseHomeHeroFlagPayload(
  payload: JsonType,
): Pick<HomeHeroExperimentAssignment, "layout" | "art"> {
  if (!payload || typeof payload !== "object") {
    return {
      layout: DEFAULT_HOME_HERO_LAYOUT,
      art: DEFAULT_HOME_HERO_ART,
    };
  }

  const record = payload as Record<string, unknown>;
  const layout = isHeroLayout(record.variant)
    ? record.variant
    : DEFAULT_HOME_HERO_LAYOUT;

  const art =
    layout === "a" && isHeroIllustration(record.illustration)
      ? record.illustration
      : DEFAULT_HOME_HERO_ART;

  return { layout, art };
}

/**
 * PostHog flag `home-hero` — variants multivariés avec payload JSON :
 * - a_vinyl → { variant: "a", illustration: "vinyl" }
 * - a_scene → { variant: "a", illustration: "scene" }
 * - b       → { variant: "b" }
 * - c       → { variant: "c" }
 * - d       → { variant: "d" }
 */
