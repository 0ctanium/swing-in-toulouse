import { describe, expect, it } from "vitest";

import {
  buildGroupedCategoryFilterOptions,
  flattenGroupedCategoryFilterOptions,
} from "@/lib/event-category-tags/grouped-options";

describe("buildGroupedCategoryFilterOptions", () => {
  it("groups category names by tag type and sorts within groups", () => {
    const groups = buildGroupedCategoryFilterOptions(
      ["Blues", "Lindy Hop", "Stage"],
      {
        "Lindy Hop": "danse",
        Blues: "danse",
        Stage: "evenement",
      },
    );

    expect(groups).toEqual([
      {
        groupLabel: "Danse",
        options: [
          { value: "Blues", label: "Blues" },
          { value: "Lindy Hop", label: "Lindy Hop" },
        ],
      },
      {
        groupLabel: "Événement",
        options: [{ value: "Stage", label: "Stage" }],
      },
    ]);
  });

  it("omits empty groups", () => {
    expect(
      buildGroupedCategoryFilterOptions(["Lindy Hop"], {
        "Lindy Hop": "danse",
      }),
    ).toHaveLength(1);
  });
});

describe("flattenGroupedCategoryFilterOptions", () => {
  it("returns all options in group order", () => {
    const groups = buildGroupedCategoryFilterOptions(
      ["Blues", "Lindy Hop"],
      { Blues: "danse", "Lindy Hop": "danse" },
    );

    expect(flattenGroupedCategoryFilterOptions(groups)).toEqual([
      { value: "Blues", label: "Blues" },
      { value: "Lindy Hop", label: "Lindy Hop" },
    ]);
  });
});
