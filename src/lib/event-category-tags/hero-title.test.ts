import { describe, expect, it } from "vitest";

import {
  DEFAULT_DANCE_HERO_TITLE_AFTER,
  DEFAULT_DANCE_HERO_TITLE_BEFORE,
  formatDanceHeroTitlePlain,
  isHeroTitleCustomized,
  resolveDanceHeroTitle,
  shouldRenderHeroTitleAfterInline,
} from "@/lib/event-category-tags/hero-title";

describe("isHeroTitleCustomized", () => {
  it("is false when all fields are unset", () => {
    expect(isHeroTitleCustomized({})).toBe(false);
  });

  it("is true when any field is explicitly set", () => {
    expect(isHeroTitleCustomized({ heroTitleAfter: "swing à Toulouse" })).toBe(
      true,
    );
  });
});

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

  it("allows an empty before segment once customized", () => {
    expect(
      resolveDanceHeroTitle("Festival", {
        heroTitleBefore: "",
        heroTitleEmphasis: "Festival",
        heroTitleAfter: "swing à Toulouse",
      }),
    ).toEqual({
      before: "",
      emphasis: "Festival",
      after: "swing à Toulouse",
    });
  });
});

describe("shouldRenderHeroTitleAfterInline", () => {
  it("renders after inline when before is empty", () => {
    expect(shouldRenderHeroTitleAfterInline("", "swing à Toulouse")).toBe(true);
  });

  it("keeps after on a second line for dance defaults", () => {
    expect(
      shouldRenderHeroTitleAfterInline(
        DEFAULT_DANCE_HERO_TITLE_BEFORE,
        DEFAULT_DANCE_HERO_TITLE_AFTER,
      ),
    ).toBe(false);
  });
});

describe("formatDanceHeroTitlePlain", () => {
  it("joins hero title parts into plain text", () => {
    expect(formatDanceHeroTitlePlain("Lindy Hop", {})).toBe(
      `${DEFAULT_DANCE_HERO_TITLE_BEFORE} Lindy Hop ${DEFAULT_DANCE_HERO_TITLE_AFTER}`,
    );
  });
});
