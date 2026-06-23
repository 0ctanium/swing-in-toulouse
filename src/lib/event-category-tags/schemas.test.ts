import { describe, expect, it } from "vitest";

import {
  eventCategoryTagMetadataSchema,
  updateCategoryTagSchema,
} from "@/lib/event-category-tags/schemas";

describe("eventCategoryTagMetadataSchema", () => {
  it("accepts valid tag types", () => {
    expect(
      eventCategoryTagMetadataSchema.safeParse({ tagType: "danse" }).success,
    ).toBe(true);
  });

  it("rejects invalid tag types", () => {
    expect(
      eventCategoryTagMetadataSchema.safeParse({ tagType: "invalid" }).success,
    ).toBe(false);
  });
});

describe("updateCategoryTagSchema", () => {
  it("accepts partial updates", () => {
    const result = updateCategoryTagSchema.safeParse({
      subtitle: "  Soirées swing  ",
      isPublished: true,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.subtitle).toBe("Soirées swing");
    }
  });

  it("rejects invalid slugs", () => {
    const result = updateCategoryTagSchema.safeParse({ slug: "Invalid Slug!" });
    expect(result.success).toBe(false);
  });

  it("transforms empty strings to null", () => {
    const result = updateCategoryTagSchema.safeParse({ subtitle: "   " });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.subtitle).toBeNull();
    }
  });
});
