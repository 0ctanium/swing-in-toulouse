import { describe, expect, it } from "vitest";

import {
  formatOrganizationCategory,
  organizationCategoryOptions,
} from "@/lib/organizations/categories";

describe("formatOrganizationCategory", () => {
  it("returns null for missing categories", () => {
    expect(formatOrganizationCategory(null)).toBeNull();
    expect(formatOrganizationCategory(undefined)).toBeNull();
  });

  it("returns French labels for known categories", () => {
    expect(formatOrganizationCategory("school")).toBe("École");
    expect(formatOrganizationCategory("association")).toBe("Association");
  });
});

describe("organizationCategoryOptions", () => {
  it("returns all category options", () => {
    expect(organizationCategoryOptions()).toEqual([
      { value: "school", label: "École" },
      { value: "association", label: "Association" },
    ]);
  });
});
