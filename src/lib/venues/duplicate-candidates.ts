import { isVenueAddressConfirmed } from "@/lib/venues/confirmation";
import {
  isPreciseVenueLocation,
  type VenueLocationKind,
} from "@/lib/venues/location-kind";
import {
  distanceMeters,
  extractPostcode,
  fuzzyAddressSimilar,
  namesSimilar,
  streetPostcodeKey,
} from "@/lib/venues/normalize";

export type DuplicateConfidence = "certain" | "likely" | "possible";

export type DuplicateReason = "place_id" | "coordinates" | "address" | "name";

export type VenueComparable = {
  id: string;
  slug: string;
  name: string;
  address: string | null;
  city: string;
  latitude: number | null;
  longitude: number | null;
  googlePlaceId: string | null;
  formattedAddress: string | null;
  addressConfirmedAt: Date | null;
  canonicalVenueId: string | null;
  locationKind: VenueLocationKind;
  eventCount: number;
};

export type VenueDuplicateCandidate = {
  venueId: string;
  name: string;
  slug: string;
  eventCount: number;
  addressLine: string;
  confirmed: boolean;
  confidence: DuplicateConfidence;
  reasons: DuplicateReason[];
  distanceMeters: number | null;
};

export type DuplicateSearchInput = {
  excludeVenueId: string;
  name: string;
  address?: string | null;
  city?: string;
  formattedAddress?: string | null;
  googlePlaceId?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  /** When true, only address/geo signals (no name-only possibles). */
  requireAddressSignal?: boolean;
  minConfidence?: DuplicateConfidence;
};

const CONFIDENCE_RANK: Record<DuplicateConfidence, number> = {
  certain: 3,
  likely: 2,
  possible: 1,
};

const COORDINATE_CERTAIN_METERS = 50;
const COORDINATE_LIKELY_METERS = 120;

function meetsMinConfidence(
  confidence: DuplicateConfidence,
  minConfidence: DuplicateConfidence | undefined,
) {
  if (!minConfidence) {
    return true;
  }

  return CONFIDENCE_RANK[confidence] >= CONFIDENCE_RANK[minConfidence];
}

function resolveAddressText(input: {
  formattedAddress?: string | null;
  address?: string | null;
  city?: string;
  name?: string;
}) {
  if (input.formattedAddress?.trim()) {
    return input.formattedAddress.trim();
  }

  if (input.address?.trim()) {
    const city = input.city?.trim();
    if (city && !input.address.toLowerCase().includes(city.toLowerCase())) {
      return `${input.address.trim()}, ${city}`;
    }

    return input.address.trim();
  }

  return null;
}

function addressKeyFromInput(input: DuplicateSearchInput) {
  return streetPostcodeKey(
    input.formattedAddress,
    input.address,
    input.name,
    input.city,
  );
}

function addressKeyFromVenue(venue: VenueComparable) {
  return streetPostcodeKey(
    venue.formattedAddress,
    venue.address,
    venue.name,
    venue.city,
  );
}

function venueAddressLine(venue: VenueComparable) {
  return (
    resolveAddressText({
      formattedAddress: venue.formattedAddress,
      address: venue.address,
      city: venue.city,
    }) ?? venue.name
  );
}

type ScoredMatch = {
  confidence: DuplicateConfidence;
  reasons: DuplicateReason[];
  distanceMeters: number | null;
};

function scoreDuplicate(
  input: DuplicateSearchInput,
  venue: VenueComparable,
): ScoredMatch | null {
  if (venue.id === input.excludeVenueId || venue.canonicalVenueId) {
    return null;
  }

  if (!isPreciseVenueLocation(venue.locationKind)) {
    return null;
  }

  const reasons: DuplicateReason[] = [];
  let confidence: DuplicateConfidence | null = null;
  let closestDistance: number | null = null;

  const inputPlaceId = input.googlePlaceId?.trim();
  const venuePlaceId = venue.googlePlaceId?.trim();

  if (inputPlaceId && venuePlaceId && inputPlaceId === venuePlaceId) {
    return { confidence: "certain", reasons: ["place_id"], distanceMeters: null };
  }

  const inputLat = input.latitude;
  const inputLng = input.longitude;
  const inputPostcode = extractPostcode(
    input.formattedAddress ?? input.address ?? "",
  );

  if (
    inputLat != null &&
    inputLng != null &&
    venue.latitude != null &&
    venue.longitude != null
  ) {
    const meters = distanceMeters(
      inputLat,
      inputLng,
      venue.latitude,
      venue.longitude,
    );
    closestDistance = meters;

    const venuePostcode = extractPostcode(
      venue.formattedAddress ?? venue.address ?? "",
    );
    const samePostcode =
      Boolean(inputPostcode) &&
      Boolean(venuePostcode) &&
      inputPostcode === venuePostcode;

    if (samePostcode && meters <= COORDINATE_CERTAIN_METERS) {
      return {
        confidence: "certain",
        reasons: ["coordinates"],
        distanceMeters: meters,
      };
    }

    if (samePostcode && meters <= COORDINATE_LIKELY_METERS) {
      confidence = "likely";
      reasons.push("coordinates");
    }
  }

  const inputKey = addressKeyFromInput(input);
  const venueKey = addressKeyFromVenue(venue);

  if (
    inputKey &&
    venueKey &&
    inputKey.length >= 8 &&
    inputKey === venueKey
  ) {
    if (!confidence || CONFIDENCE_RANK[confidence] < CONFIDENCE_RANK.likely) {
      confidence = "likely";
    }
    if (!reasons.includes("address")) {
      reasons.push("address");
    }
  } else if (
    inputKey &&
    venueKey &&
    fuzzyAddressSimilar(inputKey, venueKey)
  ) {
    if (!confidence) {
      confidence = "possible";
    }
    if (!reasons.includes("address")) {
      reasons.push("address");
    }
  }

  if (namesSimilar(input.name, venue.name)) {
    if (!confidence) {
      confidence = "possible";
    }
    if (!reasons.includes("name")) {
      reasons.push("name");
    }
  }

  if (!confidence) {
    return null;
  }

  if (
    input.requireAddressSignal &&
    confidence === "possible" &&
    !reasons.some((reason) => reason !== "name")
  ) {
    return null;
  }

  return {
    confidence,
    reasons,
    distanceMeters: closestDistance,
  };
}

export function duplicateReasonLabel(reason: DuplicateReason) {
  switch (reason) {
    case "place_id":
      return "Même lieu Google";
    case "coordinates":
      return "Coordonnées proches";
    case "address":
      return "Adresse similaire";
    case "name":
      return "Nom similaire";
  }
}

export function findVenueDuplicateCandidates(
  venues: VenueComparable[],
  input: DuplicateSearchInput,
): VenueDuplicateCandidate[] {
  const results: VenueDuplicateCandidate[] = [];

  for (const venue of venues) {
    const scored = scoreDuplicate(input, venue);
    if (!scored) {
      continue;
    }

    if (!meetsMinConfidence(scored.confidence, input.minConfidence)) {
      continue;
    }

    results.push({
      venueId: venue.id,
      name: venue.name,
      slug: venue.slug,
      eventCount: venue.eventCount,
      addressLine: venueAddressLine(venue),
      confirmed: isVenueAddressConfirmed(venue),
      confidence: scored.confidence,
      reasons: scored.reasons,
      distanceMeters: scored.distanceMeters,
    });
  }

  return results.sort((a, b) => {
    const byConfidence =
      CONFIDENCE_RANK[b.confidence] - CONFIDENCE_RANK[a.confidence];
    if (byConfidence !== 0) {
      return byConfidence;
    }

    return b.eventCount - a.eventCount;
  });
}

export type VenuePairMatchExplanation = {
  reasons: DuplicateReason[];
  distanceMeters: number | null;
  confidence: DuplicateConfidence;
};

export function explainVenuePairMatch(
  a: VenueComparable,
  b: VenueComparable,
): VenuePairMatchExplanation {
  const reasons: DuplicateReason[] = [];

  if (namesSimilar(a.name, b.name)) {
    reasons.push("name");
  }

  const scored = scoreDuplicate(
    {
      excludeVenueId: a.id,
      name: a.name,
      address: a.address,
      city: a.city,
      formattedAddress: a.formattedAddress,
      googlePlaceId: a.googlePlaceId,
      latitude: a.latitude,
      longitude: a.longitude,
      minConfidence: "possible",
    },
    b,
  );

  if (scored) {
    for (const reason of scored.reasons) {
      if (!reasons.includes(reason)) {
        reasons.push(reason);
      }
    }
  }

  return {
    reasons,
    distanceMeters: scored?.distanceMeters ?? null,
    confidence:
      scored?.confidence ?? (reasons.includes("name") ? "possible" : "likely"),
  };
}

export function formatVenuePairMatchReasons(explanation: VenuePairMatchExplanation) {
  const parts = explanation.reasons.map(duplicateReasonLabel);

  if (explanation.distanceMeters != null) {
    const hasCoordinateReason = explanation.reasons.includes("coordinates");
    if (!hasCoordinateReason) {
      parts.push(`~${Math.round(explanation.distanceMeters)} m`);
    }
  }

  return parts.join(" · ");
}

export function venuesMatchForGrouping(
  a: VenueComparable,
  b: VenueComparable,
) {
  if (a.id === b.id || a.canonicalVenueId || b.canonicalVenueId) {
    return false;
  }

  if (namesSimilar(a.name, b.name)) {
    return true;
  }

  if (
    !isPreciseVenueLocation(a.locationKind) ||
    !isPreciseVenueLocation(b.locationKind)
  ) {
    return false;
  }

  const matches = findVenueDuplicateCandidates([b], {
    excludeVenueId: a.id,
    name: a.name,
    address: a.address,
    city: a.city,
    formattedAddress: a.formattedAddress,
    googlePlaceId: a.googlePlaceId,
    latitude: a.latitude,
    longitude: a.longitude,
    minConfidence: "likely",
  });

  return matches.some((match) => match.venueId === b.id);
}

export function duplicateSearchFromPlace(
  venueId: string,
  name: string,
  place: {
    placeId: string;
    formattedAddress: string;
    address: string | null;
    city: string;
    latitude: number;
    longitude: number;
  },
): DuplicateSearchInput {
  return {
    excludeVenueId: venueId,
    name,
    formattedAddress: place.formattedAddress,
    address: place.address,
    city: place.city,
    googlePlaceId: place.placeId,
    latitude: place.latitude,
    longitude: place.longitude,
    minConfidence: "possible",
  };
}

export function duplicateSearchFromVenue(
  venue: VenueComparable,
): DuplicateSearchInput {
  return {
    excludeVenueId: venue.id,
    name: venue.name,
    address: venue.address,
    city: venue.city,
    formattedAddress: venue.formattedAddress,
    googlePlaceId: venue.googlePlaceId,
    latitude: venue.latitude,
    longitude: venue.longitude,
    requireAddressSignal: true,
    minConfidence: "possible",
  };
}
