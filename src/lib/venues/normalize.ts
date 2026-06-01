/** Accent-insensitive label for fuzzy name/address comparison. */
export function normalizeLabel(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const STREET_TOKEN_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bav\b/g, "avenue"],
  [/\bbd\b/g, "boulevard"],
  [/\bpl\b/g, "place"],
  [/\br\b/g, "rue"],
  [/\bste\b/g, "sainte"],
  [/\bst\b/g, "saint"],
  [/\bfg\b/g, "faubourg"],
];

export function normalizeStreetTokens(value: string) {
  let normalized = normalizeLabel(value);
  for (const [pattern, replacement] of STREET_TOKEN_REPLACEMENTS) {
    normalized = normalized.replace(pattern, replacement);
  }
  normalized = normalized.replace(/\bbis\b/g, "bis");
  return normalized.replace(/\s+/g, " ").trim();
}

export function extractPostcode(value: string | null | undefined) {
  if (!value?.trim()) {
    return null;
  }

  const match = value.match(/\b(\d{5})\b/);
  return match?.[1] ?? null;
}

const ADDRESS_NOISE = [
  "france",
  "toulouse",
  "occitanie",
  "haute garonne",
  "la salvetat saint gilles",
];

function stripAddressNoise(normalized: string) {
  let result = normalized;
  for (const token of ADDRESS_NOISE) {
    result = result.replace(new RegExp(`\\b${token}\\b`, "g"), " ");
  }
  return result.replace(/\s+/g, " ").trim();
}

/** Street line + postcode fingerprint for likely duplicate matches. */
export function streetPostcodeKey(
  ...parts: Array<string | null | undefined>
) {
  const combined = parts.filter(Boolean).join(" ");
  if (!combined.trim()) {
    return null;
  }

  const postcode = extractPostcode(combined);
  const withoutPostcode = combined.replace(/\b\d{5}\b/g, " ");
  const street = stripAddressNoise(normalizeStreetTokens(withoutPostcode));

  if (!street || street.length < 4) {
    return postcode ? `postcode:${postcode}` : null;
  }

  return postcode ? `${street}|${postcode}` : street;
}

export function namesSimilar(a: string, b: string) {
  const left = normalizeLabel(a);
  const right = normalizeLabel(b);

  if (!left || !right) {
    return false;
  }

  if (left === right) {
    return true;
  }

  const shorter = left.length <= right.length ? left : right;
  const longer = left.length <= right.length ? right : left;

  if (shorter.length < 4) {
    return false;
  }

  return longer.includes(shorter);
}

export function fuzzyAddressSimilar(a: string, b: string) {
  const left = normalizeStreetTokens(a);
  const right = normalizeStreetTokens(b);

  if (!left || !right || left.length < 10 || right.length < 10) {
    return false;
  }

  if (left === right) {
    return true;
  }

  return left.includes(right) || right.includes(left);
}

export function distanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const earthRadiusM = 6_371_000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;

  return earthRadiusM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
