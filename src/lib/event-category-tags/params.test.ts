import { describe, expect, it } from "vitest";

import { parseAdminCategoryTagsSearchParams } from "@/lib/event-category-tags/params";

describe("parseAdminCategoryTagsSearchParams", () => {
  it("returns defaults for empty params", () => {
    expect(parseAdminCategoryTagsSearchParams({})).toEqual({
      page: 1,
      search: "",
    });
  });

  it("parses page and search values", () => {
    expect(
      parseAdminCategoryTagsSearchParams({
        page: ["3"],
        search: ["  lindy  "],
      }),
    ).toEqual({
      page: 3,
      search: "lindy",
    });
  });

  it("clamps invalid page numbers to at least 1", () => {
    expect(parseAdminCategoryTagsSearchParams({ page: "0" }).page).toBe(1);
    expect(parseAdminCategoryTagsSearchParams({ page: "abc" }).page).toBe(1);
  });
});
