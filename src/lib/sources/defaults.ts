import type { SourceWithOrganization } from "@/db/schema";
import type { NormalizedEvent } from "@/lib/ical/types";

function isBlank(value: string | null | undefined) {
  return !value?.trim();
}

function hasCategories(categories: string[] | null | undefined) {
  return Boolean(categories?.some((category) => category.trim()));
}

export function resolveSyncedLocation(
  source: Pick<SourceWithOrganization, "defaultLocationRaw">,
  normalized: Pick<NormalizedEvent, "location">,
) {
  const fromIcal = normalized.location?.trim();
  if (fromIcal) {
    return fromIcal;
  }

  const fromDefault = source.defaultLocationRaw?.trim();
  return fromDefault || null;
}

export function resolveSyncedCategories(
  source: Pick<SourceWithOrganization, "defaultCategories">,
  normalized: Pick<NormalizedEvent, "categories">,
) {
  if (hasCategories(normalized.categories)) {
    return normalized.categories!.map((category) => category.trim()).filter(Boolean);
  }

  if (hasCategories(source.defaultCategories)) {
    return source.defaultCategories!.map((category) => category.trim()).filter(Boolean);
  }

  return null;
}

export function formatVenueAsDefaultLocation(venue: {
  name: string;
  address?: string | null;
  formattedAddress?: string | null;
}) {
  const address = venue.formattedAddress?.trim() || venue.address?.trim();
  if (address && !isBlank(address)) {
    return `${venue.name.trim()}, ${address}`;
  }

  return venue.name.trim();
}
