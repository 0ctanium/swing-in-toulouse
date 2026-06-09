import { formatInTimeZone } from "date-fns-tz";

import type { EventMaster, Organization, Venue } from "@/db/schema";
import type { EventOverridePatch } from "@/lib/events/overrides.types";
import { isVenueAddressConfirmed } from "@/lib/venues/confirmation";
import { getVenueDisplayAddress } from "@/lib/venues/display";
import { isPreciseVenueLocation } from "@/lib/venues/location-kind";
import { siteConfig } from "@/lib/site";

import type {
  IcalStoredData,
  NormalizedEvent,
  NormalizedOrganizer,
} from "./types";

export type IcalExportGeo = {
  lat: number;
  lon: number;
};

export type IcalStructuredLocation = {
  title: string;
  geo: IcalExportGeo;
};

export function formatExdateLine(date: Date, isAllDay: boolean) {
  if (isAllDay) {
    return `EXDATE;VALUE=DATE:${formatInTimeZone(date, siteConfig.timezone, "yyyyMMdd")}`;
  }

  return `EXDATE;TZID=${siteConfig.timezone}:${formatInTimeZone(date, siteConfig.timezone, "yyyyMMdd'T'HHmmss")}`;
}

export function appendExdatesToRecurrenceRule(
  recurrenceRule: string | null | undefined,
  exdates: Date[],
  isAllDay: boolean,
) {
  const lines: string[] = [];

  if (recurrenceRule) {
    for (const line of recurrenceRule.split("\n")) {
      const trimmed = line.trim();
      if (trimmed) {
        lines.push(trimmed);
      }
    }
  }

  for (const date of exdates) {
    lines.push(formatExdateLine(date, isAllDay));
  }

  return lines.length > 0 ? lines.join("\n") : undefined;
}

export function resolveIcalExportLocation(
  venue: Venue | null,
  locationRaw: string | null,
) {
  if (venue) {
    const address = getVenueDisplayAddress(venue);

    if (address) {
      const name = venue.name.trim();

      if (name && !address.toLowerCase().includes(name.toLowerCase())) {
        return `${name} - ${address}`;
      }

      return address;
    }

    if (venue.name.trim()) {
      return venue.name.trim();
    }
  }

  return locationRaw?.trim() || undefined;
}

export function resolveIcalStructuredLocation(
  venue: Venue | null,
  locationRaw: string | null,
  geo: IcalExportGeo | undefined,
): IcalStructuredLocation | undefined {
  if (!geo) {
    return undefined;
  }

  const title =
    venue?.name.trim() ||
    locationRaw?.split(",")[0]?.trim() ||
    resolveIcalExportLocation(venue, locationRaw) ||
    "Lieu";

  return { title, geo };
}

export function resolveIcalExportGeo(
  venue: Venue | null,
  icalData?: IcalStoredData | null,
): IcalExportGeo | undefined {
  if (
    venue &&
    isPreciseVenueLocation(venue.locationKind ?? "place") &&
    isVenueAddressConfirmed(venue) &&
    venue.latitude != null &&
    venue.longitude != null
  ) {
    return { lat: venue.latitude, lon: venue.longitude };
  }

  if (icalData?.geo) {
    return icalData.geo;
  }

  return undefined;
}

export function resolveIcalExportOrganizer(
  organization: Organization | null,
  icalData?: IcalStoredData | null,
): NormalizedOrganizer | undefined {
  if (icalData?.organizer?.name || icalData?.organizer?.email) {
    return icalData.organizer;
  }

  if (organization?.name) {
    return { name: organization.name };
  }

  return undefined;
}

export function resolveIcalExportUrl(
  event: Pick<EventMaster, "url" | "sourceUrl">,
) {
  return event.url?.trim() || event.sourceUrl?.trim() || undefined;
}

export function hasMaterialOccurrencePatch(patch: EventOverridePatch) {
  if (patch.hidden) {
    return false;
  }

  return (
    patch.title !== undefined ||
    patch.description !== undefined ||
    patch.startAt !== undefined ||
    patch.endAt !== undefined ||
    patch.isAllDay !== undefined ||
    patch.locationRaw !== undefined ||
    patch.venueId !== undefined ||
    patch.organizationId !== undefined ||
    patch.categories !== undefined ||
    patch.status !== undefined ||
    patch.sourceUrl !== undefined
  );
}

export function buildNormalizedEvent(
  event: EventMaster,
  options?: {
    recurrenceId?: Date;
    extraExdates?: Date[];
    includeRecurrenceRule?: boolean;
  },
): NormalizedEvent {
  const venue = event.venue;
  const location = resolveIcalExportLocation(venue, event.locationRaw);
  const geo = resolveIcalExportGeo(venue, event.icalData);
  const includeRecurrenceRule =
    options?.includeRecurrenceRule ?? !options?.recurrenceId;

  return {
    uid: event.uid,
    title: event.title,
    description: event.description ?? undefined,
    startAt: event.startAt,
    endAt: event.endAt ?? undefined,
    isAllDay: event.isAllDay,
    location,
    structuredLocation: resolveIcalStructuredLocation(
      venue,
      event.locationRaw,
      geo,
    ),
    geo,
    url: resolveIcalExportUrl(event),
    sourceUrl: event.sourceUrl ?? undefined,
    status: event.status === "cancelled" ? "cancelled" : "confirmed",
    recurrenceRule: includeRecurrenceRule
      ? appendExdatesToRecurrenceRule(
          event.recurrenceRule,
          options?.extraExdates ?? [],
          event.isAllDay,
        )
      : undefined,
    recurrenceId: options?.recurrenceId,
    categories: event.categories ?? undefined,
    sequence: event.sequence,
    lastModified: event.lastModified,
    organizer: resolveIcalExportOrganizer(event.organization, event.icalData),
    icalData: event.icalData ?? undefined,
  };
}
