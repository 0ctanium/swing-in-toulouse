import { describe, expect, it } from "vitest";

import {
  listOrganizationSocialLinks,
  normalizeOrganizationSocialLinks,
  organizationSocialPlatformOptions,
} from "@/lib/organizations/social-links";

describe("normalizeOrganizationSocialLinks", () => {
  it("returns null for explicit null", () => {
    expect(normalizeOrganizationSocialLinks(null)).toBeNull();
  });

  it("normalizes supported platform URLs", () => {
    expect(
      normalizeOrganizationSocialLinks({
        facebook: "facebook.com/club",
        instagram: "   ",
        youtube: "https://youtube.com/@club",
      }),
    ).toEqual({
      facebook: "https://facebook.com/club",
      youtube: "https://youtube.com/@club",
    });
  });

  it("returns null when no valid links remain", () => {
    expect(normalizeOrganizationSocialLinks({ facebook: "   " })).toBeNull();
  });
});

describe("listOrganizationSocialLinks", () => {
  it("returns ordered link entries with labels", () => {
    expect(
      listOrganizationSocialLinks({
        instagram: "https://instagram.com/club",
      }),
    ).toEqual([
      {
        platform: "instagram",
        label: "Instagram",
        url: "https://instagram.com/club",
      },
    ]);
  });

  it("returns an empty list for missing links", () => {
    expect(listOrganizationSocialLinks(null)).toEqual([]);
  });
});

describe("organizationSocialPlatformOptions", () => {
  it("returns all supported platforms", () => {
    expect(organizationSocialPlatformOptions()).toEqual(
      expect.arrayContaining([
        { value: "facebook", label: "Facebook" },
        { value: "instagram", label: "Instagram" },
      ]),
    );
  });
});
