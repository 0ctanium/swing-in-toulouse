import { describe, expect, it } from "vitest";

import {
  assertCategoryTagAliasesValid,
  normalizeCategoryTagAliases,
} from "@/lib/event-category-tags/aliases";

describe("normalizeCategoryTagAliases", () => {
  it("trims, dedupes case-insensitively and drops empty values", () => {
    expect(
      normalizeCategoryTagAliases([" Atelier ", "atelier", "Workshop", "  "]),
    ).toEqual(["Atelier", "Workshop"]);
  });
});

describe("assertCategoryTagAliasesValid", () => {
  it("rejects aliases that match another tag name", () => {
    expect(() =>
      assertCategoryTagAliasesValid({
        tagName: "Stage",
        aliases: ["Lindy Hop"],
        canonicalTagNames: ["Stage", "Lindy Hop"],
        aliasesByOtherTags: {},
      }),
    ).toThrow(/déjà un tag/i);
  });

  it("rejects aliases already used by another tag", () => {
    expect(() =>
      assertCategoryTagAliasesValid({
        tagName: "Stage",
        aliases: ["Atelier"],
        canonicalTagNames: ["Stage", "Festival"],
        aliasesByOtherTags: {
          Festival: ["Atelier"],
        },
      }),
    ).toThrow(/déjà un alias/i);
  });

  it("allows unique aliases for the current tag", () => {
    expect(() =>
      assertCategoryTagAliasesValid({
        tagName: "Stage",
        aliases: ["Atelier", "Workshop"],
        canonicalTagNames: ["Stage", "Festival"],
        aliasesByOtherTags: {
          Festival: ["Soirée"],
        },
      }),
    ).not.toThrow();
  });
});
