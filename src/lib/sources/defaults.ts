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

export function resolveSyncedCategoriesForUpsert(
  source: Pick<SourceWithOrganization, "defaultCategories" | "id">,
  normalized: Pick<NormalizedEvent, "categories">,
  existing?: Pick<{ sourceId: string; categories: string[] | null }, "sourceId" | "categories"> | null,
) {
  if (existing && existing.sourceId !== source.id) {
    return existing.categories;
  }

  return resolveSyncedCategories(source, normalized);
}

export function resolveSyncedLocationForUpsert(
  source: Pick<SourceWithOrganization, "defaultLocationRaw" | "id">,
  normalized: Pick<NormalizedEvent, "location">,
  existing?: Pick<{ sourceId: string; locationRaw: string | null }, "sourceId" | "locationRaw"> | null,
) {
  const fromIcal = normalized.location?.trim();
  if (fromIcal) {
    return fromIcal;
  }

  if (existing && existing.sourceId !== source.id) {
    return existing.locationRaw;
  }

  return resolveSyncedLocation(source, normalized);
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
