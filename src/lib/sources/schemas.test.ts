import { describe, expect, it } from "vitest";

import {
  normalizeSourceCategories,
  parseSourceCategoriesInput,
  parseSourceFormFields,
  sourceIcalWriteSchema,
} from "@/lib/sources/schemas";

describe("normalizeSourceCategories", () => {
  it("returns null for explicit null", () => {
    expect(normalizeSourceCategories(null)).toBeNull();
  });

  it("returns undefined for missing values", () => {
    expect(normalizeSourceCategories(undefined)).toBeUndefined();
  });

  it("trims and filters categories", () => {
    expect(normalizeSourceCategories([" lindy ", "", "blues"])).toEqual([
      "lindy",
      "blues",
    ]);
    expect(normalizeSourceCategories(["   "])).toBeNull();
  });
});

describe("parseSourceCategoriesInput", () => {
  it("parses comma-separated categories", () => {
    expect(parseSourceCategoriesInput("lindy, blues , balboa")).toEqual([
      "lindy",
      "blues",
      "balboa",
    ]);
  });
});

describe("sourceIcalWriteSchema", () => {
  it("accepts valid iCal source input", () => {
    const result = sourceIcalWriteSchema.safeParse({
      name: "Agenda principal",
      url: "https://example.com/calendar.ics",
      organizationId: "22222222-2222-4222-8222-222222222222",
    });

    expect(result.success).toBe(true);
  });

  it("rejects invalid URLs", () => {
    const result = sourceIcalWriteSchema.safeParse({
      name: "Agenda principal",
      url: "not-a-url",
    });

    expect(result.success).toBe(false);
  });
});

describe("parseSourceFormFields", () => {
  it("parses form data into write fields", () => {
    const formData = new FormData();
    formData.set("name", "Agenda principal");
    formData.set("slug", "agenda-principal");
    formData.set("organizationId", "22222222-2222-4222-8222-222222222222");
    formData.set("defaultCategories", "lindy, blues");
    formData.set("defaultLocationRaw", "Toulouse");
    formData.set("isActive", "false");

    expect(parseSourceFormFields(formData)).toEqual({
      name: "Agenda principal",
      slug: "agenda-principal",
      organizationId: "22222222-2222-4222-8222-222222222222",
      defaultLocationRaw: "Toulouse",
      defaultCategories: ["lindy", "blues"],
      isActive: false,
    });
  });
});
