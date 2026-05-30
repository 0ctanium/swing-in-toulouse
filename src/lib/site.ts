import { env, getCronSyncUrl, isQStashConfigured } from "@/env";

export const siteConfig = {
  name: "Swing Toulouse",
  description:
    "L'agenda swing à Toulouse — soirées, cours, stages et festivals de Lindy Hop, Boogie Woogie et plus.",
  url: env.NEXT_PUBLIC_SITE_URL,
  locale: "fr-FR",
  timezone: "Europe/Paris",
  icalProdId: "-//Swing Toulouse//Agenda//FR",
  icalDomain: "swing-toulouse.fr",
} as const;

export function absoluteUrl(path: string) {
  return new URL(path, siteConfig.url).toString();
}

export function eventUrl(slug: string) {
  return absoluteUrl(`/evenement/${slug}`);
}

export function organizerUrl(slug: string) {
  return absoluteUrl(`/organisateur/${slug}`);
}

/** @deprecated Use organizerUrl */
export function organizationUrl(slug: string) {
  return organizerUrl(slug);
}

export function venueUrl(slug: string) {
  return absoluteUrl(`/lieu/${slug}`);
}

export { getCronSyncUrl, isQStashConfigured };
