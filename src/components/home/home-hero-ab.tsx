"use client";

import { HomeHero } from "@/components/home/home-hero";
import { HOME_HERO_FLAG } from "@/lib/posthog/home-hero";
import { useFeatureFlagVariantKey } from "@posthog/react";

export function HomeHeroAb() {
  const variant = useFeatureFlagVariantKey(HOME_HERO_FLAG);

  switch (variant) {
    default:
    case "a_vinyl":
      return <HomeHero art="vinyl" variant="a" />;
    case "a_scene":
      return <HomeHero art="scene" variant="a" />;
    case "b":
      return <HomeHero variant="b" />;
    case "c":
      return <HomeHero variant="c" />;
    case "d":
      return <HomeHero variant="d" />;
  }
}
