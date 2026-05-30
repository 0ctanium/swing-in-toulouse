import { slugifyText } from "@/lib/slug";

function normalizeLabel(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export type ParsedIcalLocation = {
  name: string;
  address: string | null;
  fullLocation: string;
};

/** Split iCal LOCATION into display name + address remainder. */
export function parseIcalLocation(location: string): ParsedIcalLocation {
  const fullLocation = location.trim();

  if (!fullLocation) {
    return { name: "", address: null, fullLocation };
  }

  const commaIndex = fullLocation.indexOf(",");
  if (commaIndex === -1) {
    return {
      name: fullLocation,
      address: null,
      fullLocation,
    };
  }

  const name = fullLocation.slice(0, commaIndex).trim() || fullLocation;
  const address = fullLocation.slice(commaIndex + 1).trim() || null;

  return {
    name,
    address,
    fullLocation,
  };
}

export type VenueQualityIssue =
  | "name_equals_address"
  | "name_looks_like_address"
  | "missing_address";

export type VenueQualityReport = {
  incoherent: boolean;
  issues: VenueQualityIssue[];
};

export function assessVenueQuality(venue: {
  name: string;
  address: string | null;
}): VenueQualityReport {
  const issues: VenueQualityIssue[] = [];
  const normalizedName = normalizeLabel(venue.name);

  if (!venue.address?.trim()) {
    if (
      venue.name.includes(",") ||
      /\b\d{5}\b/.test(venue.name) ||
      /^\d+\s/.test(venue.name)
    ) {
      issues.push("name_looks_like_address");
    } else if (venue.name.trim()) {
      issues.push("missing_address");
    }
  } else {
    const normalizedAddress = normalizeLabel(venue.address);
    const normalizedFull = normalizeLabel(`${venue.name}, ${venue.address}`);

    if (
      normalizedName === normalizedAddress ||
      normalizedName === normalizeLabel(venue.address)
    ) {
      issues.push("name_equals_address");
    }

    if (normalizedName === normalizedFull && venue.address.includes(",")) {
      issues.push("name_equals_address");
    }
  }

  return {
    incoherent: issues.some(
      (issue) => issue !== "missing_address",
    ),
    issues,
  };
}

export function venueSlugFromLocation(location: string) {
  const { name } = parseIcalLocation(location);
  return slugifyText(name || location);
}

export function venueIssueLabel(issue: VenueQualityIssue) {
  switch (issue) {
    case "name_equals_address":
      return "Nom et adresse identiques ou redondants";
    case "name_looks_like_address":
      return "Le nom ressemble à une adresse complète";
    case "missing_address":
      return "Adresse manquante";
  }
}
