import type { VenueLocationKind } from "@/db/schema";
import { venueLocationKindEnum } from "@/db/schema";
import {
  parseIcalLocation,
  type ParsedIcalLocation,
} from "@/lib/venues/parse-location";
import { normalizeLabel } from "@/lib/venues/normalize";

export const venueLocationKindValues = venueLocationKindEnum.enumValues;

export type { VenueLocationKind };

export const venueLocationKindLabels: Record<VenueLocationKind, string> = {
  place: "Lieu précis",
  area: "Zone / lieu vague",
  none: "Sans adresse précise",
};

export function formatVenueLocationKind(kind: VenueLocationKind) {
  return venueLocationKindLabels[kind];
}

export function venueLocationKindOptions() {
  return venueLocationKindValues.map((value) => ({
    value,
    label: venueLocationKindLabels[value],
  }));
}

export function isPreciseVenueLocation(kind: VenueLocationKind) {
  return kind === "place";
}

const CITY_AREA_NAMES = new Set([
  "toulouse",
  "france",
  "occitanie",
  "haute garonne",
]);

/** Guess location kind from a raw iCal LOCATION string. */
export function inferLocationKindFromIcal(
  location: string,
  parsed: ParsedIcalLocation = parseIcalLocation(location),
): VenueLocationKind {
  const name = parsed.name.trim();
  if (!name) {
    return "none";
  }

  const addressPart = parsed.address?.trim() ?? "";
  const hasCommaInRaw = location.includes(",");
  const nameHasStreetNumber = /^\d+\s+\S/.test(name) || /\b\d{5}\b/.test(name);

  if (addressPart) {
    const addressLooksPrecise =
      /\b\d{5}\b/.test(addressPart) ||
      /^\d+\s/.test(addressPart) ||
      addressPart.length >= 18;

    if (addressLooksPrecise) {
      return "place";
    }
  }

  if (nameHasStreetNumber) {
    return "place";
  }

  const normalizedName = normalizeLabel(name);
  if (CITY_AREA_NAMES.has(normalizedName)) {
    return "area";
  }

  if (!hasCommaInRaw && !addressPart && !/\d/.test(name)) {
    return "area";
  }

  return "place";
}

export function googleFieldsForLocationKind(
  kind: VenueLocationKind,
): {
  latitude: null;
  longitude: null;
  googlePlaceId: null;
  formattedAddress: null;
  addressConfirmedAt: null;
} | Record<string, never> {
  if (kind === "place") {
    return {};
  }

  return {
    latitude: null,
    longitude: null,
    googlePlaceId: null,
    formattedAddress: null,
    addressConfirmedAt: null,
  };
}
