import { env, getCronSyncUrl, isQStashConfigured } from "@/env";
import {
  buildIcalFeedPath,
  emptyIcalPayload,
  type IcalPayload,
} from "@/lib/ical/payload";

export const siteConfig = {
  name: "Swingin Toulouse",
  title:
    "Lindy Hop, Blues, Balboa, Boogie à Toulouse : Agenda des soirées swing | Swingin Toulouse",
  description:
    "L'agenda swing à Toulouse : soirées, cours, stages et festivals de Lindy Hop, Blues, Balboa, Boogie Woogie et plus.",
  url: env.NEXT_PUBLIC_SITE_URL,
  locale: "fr-FR",
  timezone: "Europe/Paris",
  icalProdId: "-//Swingin Toulouse//Agenda//FR",
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

export function icalFeedUrl(filters: IcalPayload = emptyIcalPayload()) {
  return absoluteUrl(buildIcalFeedPath(filters));
}

export function organizerIcalUrl(slug: string) {
  return icalFeedUrl({ ...emptyIcalPayload(), org: [slug] });
}

export function eventIcalUrl(slug: string) {
  return icalFeedUrl({ ...emptyIcalPayload(), event: [slug] });
}

export { getCronSyncUrl, isQStashConfigured };
