import { describe, expect, it } from "vitest";

import { resolveEventCategoryTagType } from "@/lib/event-category-tags/metadata";

describe("resolveEventCategoryTagType", () => {
  it("returns the metadata tag type when present", () => {
    expect(resolveEventCategoryTagType("Lindy Hop", { "Lindy Hop": "danse" })).toBe(
      "danse",
    );
  });

  it("falls back to the default tag type", () => {
    expect(resolveEventCategoryTagType("Unknown", {})).toBe("autre");
  });
});
