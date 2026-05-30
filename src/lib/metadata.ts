import type { Metadata } from "next";

import { absoluteUrl, siteConfig } from "@/lib/site";

const adminRobots: NonNullable<Metadata["robots"]> = {
  index: false,
  follow: false,
  googleBot: { index: false, follow: false },
};

type PublicMetadataOptions = {
  title: Metadata["title"];
  description?: string;
  path?: string;
};

export function publicMetadata({
  title,
  description = siteConfig.description,
  path,
}: PublicMetadataOptions): Metadata {
  const canonical = path ? absoluteUrl(path) : undefined;
  const openGraphTitle =
    typeof title === "string"
      ? title
      : title && typeof title === "object" && "absolute" in title
        ? title.absolute
        : siteConfig.name;

  return {
    title,
    description,
    ...(canonical && {
      alternates: { canonical },
      openGraph: {
        title: openGraphTitle,
        description,
        url: canonical,
        siteName: siteConfig.name,
        locale: siteConfig.locale,
        type: "website",
      },
    }),
  };
}

type AdminMetadataOptions = {
  title: string;
  description?: string;
};

export function adminMetadata({
  title,
  description,
}: AdminMetadataOptions): Metadata {
  return {
    title,
    description:
      description ??
      `Administration de ${siteConfig.name} — gestion des événements, lieux et sources.`,
    robots: adminRobots,
  };
}

export const adminSectionRobots: Metadata = {
  robots: adminRobots,
};
