import { hasActiveAgendaFilters } from "@/lib/events/agenda-filters";
import {
  buildIcalFeedPath,
  hasActiveIcalPayload,
  type IcalPayload,
} from "@/lib/ical/payload";
import { siteConfig } from "@/lib/site";

export type CalendarSubscribeOption = {
  id: string;
  label: string;
  description?: string;
  href: string;
  external?: boolean;
};

export function getIcalFeedAbsoluteUrl(payload: IcalPayload) {
  return new URL(buildIcalFeedPath(payload), siteConfig.url).toString();
}

export function toWebcalUrl(httpsUrl: string) {
  return httpsUrl.replace(/^https?:\/\//, "webcal://");
}

/** Google Calendar deep links expect a webcal URL, not a base64-encoded feed URL. */
export function getGoogleCalendarSubscribeUrl(feedUrl: string) {
  return `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(toWebcalUrl(feedUrl))}`;
}

export function getDefaultFeedName(payload: IcalPayload, feedName?: string) {
  if (feedName?.trim()) {
    return feedName.trim();
  }

  if (payload.event.length === 1 && !hasActiveAgendaFilters(payload)) {
    return payload.event[0]!;
  }

  if (
    payload.org.length === 1 &&
    payload.category.length === 0 &&
    payload.venue.length === 0 &&
    payload.event.length === 0
  ) {
    return payload.org[0]!;
  }

  if (!hasActiveIcalPayload(payload)) {
    return siteConfig.name;
  }

  return siteConfig.name;
}

export function buildCalendarSubscribeOptions(
  payload: IcalPayload,
  feedName?: string,
): CalendarSubscribeOption[] {
  const feedUrl = getIcalFeedAbsoluteUrl(payload);
  const name = getDefaultFeedName(payload, feedName);

  return [
    {
      id: "google",
      label: "Google Agenda",
      description: "Ouvrir dans Google Calendar",
      href: getGoogleCalendarSubscribeUrl(feedUrl),
      external: true,
    },
    {
      id: "apple",
      label: "Apple Calendrier",
      description: "Calendrier sur iPhone, iPad ou Mac",
      href: toWebcalUrl(feedUrl),
    },
    {
      id: "outlook",
      label: "Outlook.com",
      description: "Compte Microsoft personnel",
      href: `https://outlook.live.com/calendar/0/addfromweb?${new URLSearchParams({ url: feedUrl, name }).toString()}`,
      external: true,
    },
    {
      id: "office365",
      label: "Outlook (professionnel)",
      description: "Compte Microsoft 365 ou Exchange",
      href: `https://outlook.office.com/calendar/0/addfromweb?${new URLSearchParams({ url: feedUrl, name }).toString()}`,
      external: true,
    },
    {
      id: "download",
      label: "Télécharger le fichier .ics",
      description: "Pour d'autres applications",
      href: feedUrl,
    },
  ];
}
