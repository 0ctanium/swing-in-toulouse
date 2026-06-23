import { describe, expect, it } from "vitest";

import { normalizeOrganizationWebsite } from "@/lib/organizations/urls";

describe("normalizeOrganizationWebsite", () => {
  it("returns null for empty values", () => {
    expect(normalizeOrganizationWebsite(null)).toBeNull();
    expect(normalizeOrganizationWebsite("   ")).toBeNull();
  });

  it("adds https when the scheme is missing", () => {
    expect(normalizeOrganizationWebsite("swing-club.fr")).toBe(
      "https://swing-club.fr/",
    );
  });

  it("preserves valid absolute URLs", () => {
    expect(normalizeOrganizationWebsite("https://swing-club.fr/agenda")).toBe(
      "https://swing-club.fr/agenda",
    );
  });

  it("returns the trimmed value when parsing fails", () => {
    expect(normalizeOrganizationWebsite("not a valid url")).toBe(
      "not a valid url",
    );
  });
});
