import { normalizeOrganizationWebsite } from "@/lib/organizations/urls";

export const organizationSocialPlatformValues = [
  "facebook",
  "instagram",
  "youtube",
  "tiktok",
] as const;

export type OrganizationSocialPlatform =
  (typeof organizationSocialPlatformValues)[number];

export type OrganizationSocialLinks = Partial<
  Record<OrganizationSocialPlatform, string>
>;

export const organizationSocialPlatformLabels: Record<
  OrganizationSocialPlatform,
  string
> = {
  facebook: "Facebook",
  instagram: "Instagram",
  youtube: "YouTube",
  tiktok: "TikTok",
};

export function organizationSocialPlatformOptions() {
  return organizationSocialPlatformValues.map((value) => ({
    value,
    label: organizationSocialPlatformLabels[value],
  }));
}

export function normalizeOrganizationSocialLinks(
  links: OrganizationSocialLinks | null | undefined,
): OrganizationSocialLinks | null | undefined {
  if (links === null) {
    return null;
  }

  if (!links) {
    return undefined;
  }

  const normalized: OrganizationSocialLinks = {};

  for (const platform of organizationSocialPlatformValues) {
    const url = normalizeOrganizationWebsite(links[platform]);
    if (url) {
      normalized[platform] = url;
    }
  }

  return Object.keys(normalized).length > 0 ? normalized : null;
}

export function listOrganizationSocialLinks(
  links: OrganizationSocialLinks | null | undefined,
) {
  if (!links) {
    return [];
  }

  return organizationSocialPlatformValues
    .map((platform) => {
      const url = links[platform];
      if (!url) {
        return null;
      }

      return {
        platform,
        label: organizationSocialPlatformLabels[platform],
        url,
      };
    })
    .filter((entry) => entry !== null);
}
