import { describe, expect, it } from "vitest";

import {
  DEFAULT_DANCE_HERO_TITLE_AFTER,
  DEFAULT_DANCE_HERO_TITLE_BEFORE,
  formatDanceHeroTitlePlain,
  resolveDanceHeroTitle,
} from "@/lib/event-category-tags/hero-title";

describe("resolveDanceHeroTitle", () => {
  it("uses defaults when fields are missing", () => {
    expect(resolveDanceHeroTitle("Lindy Hop", {})).toEqual({
      before: DEFAULT_DANCE_HERO_TITLE_BEFORE,
      emphasis: "Lindy Hop",
      after: DEFAULT_DANCE_HERO_TITLE_AFTER,
    });
  });

  it("allows custom hero title fields", () => {
    expect(
      resolveDanceHeroTitle("Lindy Hop", {
        heroTitleBefore: "Découvrir le",
        heroTitleEmphasis: "Lindy",
        heroTitleAfter: "en ville",
      }),
    ).toEqual({
      before: "Découvrir le",
      emphasis: "Lindy",
      after: "en ville",
    });
  });
});

describe("formatDanceHeroTitlePlain", () => {
  it("joins hero title parts into plain text", () => {
    expect(formatDanceHeroTitlePlain("Lindy Hop", {})).toBe(
      `${DEFAULT_DANCE_HERO_TITLE_BEFORE} Lindy Hop ${DEFAULT_DANCE_HERO_TITLE_AFTER}`,
    );
  });
});
