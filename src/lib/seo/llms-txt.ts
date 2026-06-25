import { cacheLife, cacheTag } from "next/cache";

import { CACHE_TAGS } from "@/lib/cache/tags";
import { SITEMAP_REVALIDATE } from "@/lib/cache/revalidate";
import {
  dancePageDescription,
  listPublishedDanceTagsUncached,
  type PublishedDanceTag,
} from "@/lib/event-category-tags/dance-pages";
import { GLOBAL_ICAL_PAYLOAD } from "@/lib/ical/payload";
import { absoluteUrl, siteConfig } from "@/lib/site";

function llmsLink(title: string, path: string, description: string) {
  return `- [${title}](${absoluteUrl(path)}): ${description}`;
}

function urlPattern(path: string) {
  return `${siteConfig.url}${path}`;
}

export function formatLlmsTxtContent(dances: PublishedDanceTag[]) {
  const lines = [
    `# ${siteConfig.name}`,
    "",
    `> ${siteConfig.description}`,
    "",
    "## Pages principales",
    llmsLink(
      "Accueil",
      "/",
      "Page d'accueil avec les prochains événements swing à Toulouse.",
    ),
    llmsLink(
      "Agenda",
      "/agenda",
      "Calendrier interactif des soirées, cours, stages et festivals à venir, avec filtres par danse, lieu et organisateur.",
    ),
    llmsLink(
      "Événements",
      "/evenements",
      "Liste paginée de tous les événements à venir.",
    ),
    llmsLink(
      "Organisateurs",
      "/organisateurs",
      "Annuaire des associations, écoles et collectifs qui programment des événements swing.",
    ),
    llmsLink(
      "Lieux",
      "/lieux",
      "Annuaire des salles et adresses où ont lieu les événements swing à Toulouse.",
    ),
    llmsLink(
      "Danses",
      "/danse",
      "Index des styles de danse swing couverts par l'agenda (Lindy Hop, Blues, Balboa, etc.).",
    ),
    "",
    "## Danses à Toulouse",
    ...dances.map((dance) =>
      llmsLink(
        dance.name,
        `/danse/${dance.slug}`,
        dancePageDescription(dance),
      ),
    ),
    "",
    "## Données machine-lisibles",
    llmsLink(
      "Sitemap",
      "/sitemap.xml",
      "Liste complète des URLs publiques indexables (événements, lieux, organisateurs, archives mensuelles).",
    ),
    llmsLink(
      "Robots",
      "/robots.txt",
      "Règles d'exploration pour les crawlers ; l'administration (/admin/) est exclue.",
    ),
    llmsLink(
      "API événements",
      "/api/events",
      "JSON des événements sur une plage de dates ; paramètres requis : from et to (ISO 8601), optionnel : limit.",
    ),
    llmsLink(
      "API filtres agenda",
      "/api/events/filters",
      "JSON des catégories, lieux et organisateurs disponibles pour filtrer l'agenda.",
    ),
    llmsLink(
      "Flux iCal global",
      `/api/ical/${GLOBAL_ICAL_PAYLOAD}.ics`,
      "Abonnement calendrier de tous les événements à venir (alias court : /agenda.ics).",
    ),
    llmsLink(
      "Flux Atom",
      "/feed.xml",
      "Flux Atom des 50 prochains événements à venir (syndication et lecteurs RSS).",
    ),
    "",
    "## Modèles d'URL",
    "",
    "Chaque entité publique a une page dédiée avec métadonnées schema.org :",
    "",
    `- Événement : ${urlPattern("/evenement/{slug}")}`,
    `- Organisateur : ${urlPattern("/organisateur/{slug}")}`,
    `- Lieu : ${urlPattern("/lieu/{slug}")}`,
    `- Archive mensuelle : ${urlPattern("/evenements/{year}/{month}")}`,
    `- Abonnement iCal par organisateur : ${urlPattern("/organisateur/{slug}.ics")}`,
    `- Abonnement iCal par événement : ${urlPattern("/evenement/{slug}.ics")}`,
    "",
    `Langue : ${siteConfig.locale}. Fuseau horaire : ${siteConfig.timezone}.`,
  ];

  return `${lines.join("\n")}\n`;
}

async function buildLlmsTxtUncached() {
  const dances = await listPublishedDanceTagsUncached();
  return formatLlmsTxtContent(dances);
}

export async function buildLlmsTxt() {
  "use cache";
  cacheLife({
    stale: SITEMAP_REVALIDATE,
    revalidate: SITEMAP_REVALIDATE,
  });
  cacheTag(CACHE_TAGS.categoryTags);

  return buildLlmsTxtUncached();
}
