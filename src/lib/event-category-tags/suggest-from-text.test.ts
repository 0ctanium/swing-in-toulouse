import { describe, expect, it } from "vitest";

import {
  findCategoryTagMatchesInText,
  normalizeTextForTagMatching,
  suggestCategoryTagsFromText,
} from "@/lib/event-category-tags/suggest-from-text";

const candidateTags = [
  "Balboa",
  "Blues",
  "Festival",
  "Lindy Hop",
  "Rock",
  "Rock'n'Roll",
  "Soirée",
  "Stage",
] as const;

describe("normalizeTextForTagMatching", () => {
  it("lowercases and removes accents", () => {
    expect(normalizeTextForTagMatching("Soirée Lindy")).toBe("soiree lindy");
  });
});

describe("findCategoryTagMatchesInText", () => {
  it("matches full tag names case-insensitively", () => {
    expect(
      findCategoryTagMatchesInText("Initiation Lindy Hop ce samedi", candidateTags),
    ).toEqual([{ tag: "Lindy Hop", kind: "exact" }]);
  });

  it("matches plural variants on event types", () => {
    expect(
      findCategoryTagMatchesInText("Grande soirées de blues", candidateTags),
    ).toEqual([
      { tag: "Blues", kind: "exact" },
      { tag: "Soirée", kind: "flexible" },
    ]);
  });

  it("matches a unique first-word alias for multi-word dance tags", () => {
    expect(
      findCategoryTagMatchesInText("Cours de Lindy pour débutants", candidateTags),
    ).toEqual([{ tag: "Lindy Hop", kind: "alias" }]);
  });

  it("does not alias ambiguous short first words", () => {
    expect(findCategoryTagMatchesInText("Concert rock", candidateTags)).toEqual([
      { tag: "Rock", kind: "exact" },
    ]);
  });

  it("does not alias a shared word when another tag already matches it in context", () => {
    const danceTags = [
      "Jazz Manouche",
      "Lindy Hop",
      "Solo Jazz",
      "Swing",
    ] as const;

    const description =
      "Mardi - solo jazz - 2 niveaux. Mercredi - Lindy Hop - 2 niveaux. La Candela Swing propose des ateliers de Solo Jazz et de Lindy Hop.";

    expect(findCategoryTagMatchesInText(description, danceTags)).toEqual([
      { tag: "Lindy Hop", kind: "exact" },
      { tag: "Solo Jazz", kind: "exact" },
      { tag: "Swing", kind: "exact" },
    ]);
  });
});

describe("suggestCategoryTagsFromText", () => {
  it("merges title and description and excludes selected tags", () => {
    expect(
      suggestCategoryTagsFromText({
        title: "Stage Lindy",
        description: "Week-end festival blues",
        candidateTags,
        selectedTags: ["Lindy Hop"],
      }),
    ).toEqual(["Festival", "Blues", "Stage"]);
  });

  it("returns an empty list when nothing matches", () => {
    expect(
      suggestCategoryTagsFromText({
        title: "Réunion générale",
        description: "Sans danse",
        candidateTags,
      }),
    ).toEqual([]);
  });
});
