"use client";

import posthog from "posthog-js";
import { useEffect, useRef } from "react";

import type { HomeHeroAssignment } from "@/lib/posthog/get-home-hero-assignment";
import { HOME_HERO_FLAG } from "@/lib/posthog/home-hero";

type HomeHeroExposureProps = Pick<
  HomeHeroAssignment,
  "layout" | "art" | "flagVariant"
>;

export function HomeHeroExposure({
  layout,
  art,
  flagVariant,
}: HomeHeroExposureProps) {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) {
      return;
    }

    sent.current = true;
    posthog.capture("home_hero_shown", {
      flag: HOME_HERO_FLAG,
      flag_variant: flagVariant,
      hero_layout_variant: layout,
      ...(layout === "a" ? { hero_art_variant: art } : {}),
    });
  }, [art, flagVariant, layout]);

  return null;
}
