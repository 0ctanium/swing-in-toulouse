import { describe, expect, it } from "vitest";

import {
  isOrganizationDance,
  normalizeOrganizationDances,
  organizationDanceOptions,
} from "@/lib/organizations/dances";

describe("isOrganizationDance", () => {
  it("recognizes supported dances", () => {
    expect(isOrganizationDance("Lindy Hop")).toBe(true);
    expect(isOrganizationDance("Tango")).toBe(false);
  });
});

describe("normalizeOrganizationDances", () => {
  it("returns null for explicit null", () => {
    expect(normalizeOrganizationDances(null)).toBeNull();
  });

  it("returns undefined for missing values", () => {
    expect(normalizeOrganizationDances(undefined)).toBeUndefined();
  });

  it("filters unknown dances and trims values", () => {
    expect(
      normalizeOrganizationDances([" Lindy Hop ", "Tango", "Blues"]),
    ).toEqual(["Lindy Hop", "Blues"]);
  });

  it("returns null when no valid dances remain", () => {
    expect(normalizeOrganizationDances(["Tango", "  "])).toBeNull();
  });
});

describe("organizationDanceOptions", () => {
  it("returns all supported dances", () => {
    expect(organizationDanceOptions().length).toBeGreaterThan(0);
    expect(organizationDanceOptions()[0]).toEqual(
      expect.objectContaining({ value: expect.any(String), label: expect.any(String) }),
    );
  });
});
