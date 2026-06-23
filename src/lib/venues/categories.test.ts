import { describe, expect, it } from "vitest";

import {
  formatVenueCategory,
  venueCategoryOptions,
} from "@/lib/venues/categories";

describe("formatVenueCategory", () => {
  it("returns null for missing categories", () => {
    expect(formatVenueCategory(null)).toBeNull();
  });

  it("returns French labels for known categories", () => {
    expect(formatVenueCategory("bar")).toBe("Bar / Guinguette");
    expect(formatVenueCategory("hall")).toBe("Salle");
  });
});

describe("venueCategoryOptions", () => {
  it("returns all venue categories", () => {
    expect(venueCategoryOptions().length).toBeGreaterThan(0);
    expect(venueCategoryOptions()).toEqual(
      expect.arrayContaining([
        { value: "school", label: "École" },
        { value: "other", label: "Autre" },
      ]),
    );
  });
});
