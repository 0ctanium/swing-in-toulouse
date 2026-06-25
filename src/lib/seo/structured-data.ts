import type { EventMaster, Organization, Venue } from "@/db/schema";
import type { EventOccurrence } from "@/lib/events/queries";
import { getVenueDisplayAddress, getVenueMapsUrl } from "@/lib/venues/display";
import { absoluteUrl, eventUrl, organizerUrl, siteConfig, venueUrl } from "@/lib/site";

export function eventStructuredData(
  event: Pick<
    EventOccurrence,
    | "title"
    | "description"
    | "startAt"
    | "endAt"
    | "slug"
    | "sourceUrl"
    | "organization"
    | "venue"
    | "locationRaw"
    | "status"
  >,
) {
  const location = event.venue
    ? {
        "@type": "Place" as const,
        name: event.venue.name,
        url: venueUrl(event.venue.slug),
        ...(getVenueDisplayAddress(event.venue) && {
          address: getVenueDisplayAddress(event.venue),
        }),
      }
    : event.locationRaw
      ? {
          "@type": "Place" as const,
          name: event.locationRaw,
        }
      : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.description ?? undefined,
    startDate: event.startAt.toISOString(),
    ...(event.endAt && { endDate: event.endAt.toISOString() }),
    eventStatus:
      event.status === "cancelled"
        ? "https://schema.org/EventCancelled"
        : "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    url: eventUrl(event.slug),
    ...(event.sourceUrl && { sameAs: event.sourceUrl }),
    ...(location && { location }),
    ...(event.organization && {
      organizer: organizationStructuredData(event.organization),
    }),
  };
}

export function organizationStructuredData(
  organization: Pick<
    Organization,
    "name" | "slug" | "description" | "website" | "category"
  >,
) {
  return {
    "@type": "Organization",
    name: organization.name,
    url: organizerUrl(organization.slug),
    description: organization.description ?? undefined,
    ...(organization.website && { sameAs: organization.website }),
  };
}

export function placeStructuredData(
  venue: Pick<
    Venue,
    | "name"
    | "slug"
    | "city"
    | "address"
    | "formattedAddress"
    | "addressConfirmedAt"
    | "latitude"
    | "longitude"
    | "googlePlaceId"
  >,
) {
  const displayAddress = getVenueDisplayAddress(venue);
  const mapsUrl = getVenueMapsUrl(venue);

  return {
    "@context": "https://schema.org",
    "@type": "Place",
    name: venue.name,
    url: venueUrl(venue.slug),
    ...(displayAddress && { address: displayAddress }),
    ...(venue.latitude &&
      venue.longitude && {
        geo: {
          "@type": "GeoCoordinates",
          latitude: venue.latitude,
          longitude: venue.longitude,
        },
      }),
    ...(mapsUrl && { hasMap: mapsUrl }),
  };
}

export function eventBreadcrumbs(event: Pick<EventMaster, "title" | "slug">) {
  return [
    { label: "Accueil", href: "/" },
    { label: "Événements", href: "/evenements" },
    { label: event.title },
  ];
}

export function organizerBreadcrumbs(
  organizer: Pick<Organization, "name" | "slug">,
) {
  return [
    { label: "Accueil", href: "/" },
    { label: "Organisateurs", href: "/organisateurs" },
    { label: organizer.name },
  ];
}

export function venueBreadcrumbs(venue: Pick<Venue, "name" | "slug">) {
  return [
    { label: "Accueil", href: "/" },
    { label: "Lieux", href: "/lieux" },
    { label: venue.name },
  ];
}

export function archiveBreadcrumbs(year: number, month: number, monthLabel: string) {
  return [
    { label: "Accueil", href: "/" },
    { label: "Événements", href: "/evenements" },
    {
      label: monthLabel,
      href: `/evenements/${year}/${String(month).padStart(2, "0")}`,
    },
  ];
}

export function danceIndexBreadcrumbs() {
  return [
    { label: "Accueil", href: "/" },
    { label: "Danses" },
  ];
}

export function danceBreadcrumbs(tag: { name: string; slug: string }) {
  return [
    { label: "Accueil", href: "/" },
    { label: "Danses", href: "/danse" },
    { label: tag.name },
  ];
}

export function evenementsCollectionBreadcrumbs(collection: {
  label: string;
  path: string;
}) {
  return [
    { label: "Accueil", href: "/" },
    { label: "Événements", href: "/evenements" },
    { label: collection.label, href: collection.path },
  ];
}

export function siteWebSiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    alternateName: [siteConfig.icalDomain],
    url: absoluteUrl("/"),
    description: siteConfig.description,
    inLanguage: siteConfig.locale,
  };
}
