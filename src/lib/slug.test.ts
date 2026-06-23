import { describe, expect, it } from "vitest";

import {
  categoryTagSlugPattern,
  generateCategoryTagSlug,
  generateEventSlug,
  generateOrganizationSlug,
  generateSourceSlug,
  generateVenueSlug,
  slugifyText,
} from "@/lib/slug";

describe("slugifyText", () => {
  it("slugifies French text", () => {
    expect(slugifyText("École de Swing")).toBe("ecole-de-swing");
  });
});

describe("slug generators", () => {
  it("builds event slugs from title and date", () => {
    const slug = generateEventSlug(
      "Soirée Lindy",
      new Date("2026-03-15T20:00:00+01:00"),
    );

    expect(slug).toContain("soiree-lindy");
    expect(slug).toContain("2026");
  });

  it("builds entity slugs from names", () => {
    expect(generateVenueSlug("Le Grand Bal")).toBe("le-grand-bal");
    expect(generateOrganizationSlug("Swing Club")).toBe("swing-club");
    expect(generateSourceSlug("Agenda principal")).toBe("agenda-principal");
    expect(generateCategoryTagSlug("Lindy Hop")).toBe("lindy-hop");
  });
});

describe("categoryTagSlugPattern", () => {
  it("accepts lowercase hyphenated slugs", () => {
    expect(categoryTagSlugPattern.test("lindy-hop")).toBe(true);
    expect(categoryTagSlugPattern.test("Lindy Hop")).toBe(false);
  });
});
