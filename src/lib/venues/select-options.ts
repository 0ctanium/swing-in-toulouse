import type { venues } from "@/db/schema";

export type VenueSelectOption = {
  id: string;
  slug: string;
  name: string;
  address: string | null;
  formattedAddress: string | null;
  city: string | null;
  canonicalVenueId: string | null;
};

export function venueAddressLine(
  venue: Pick<VenueSelectOption, "address" | "formattedAddress" | "city">,
) {
  if (venue.formattedAddress?.trim()) {
    return venue.formattedAddress.trim();
  }

  if (venue.address?.trim()) {
    const city = venue.city?.trim();
    return city ? `${venue.address.trim()}, ${city}` : venue.address.trim();
  }

  if (venue.city?.trim()) {
    return venue.city.trim();
  }

  return "Adresse incomplète";
}

export function toVenueSelectOption(
  venue: Pick<
    typeof venues.$inferSelect,
    | "id"
    | "slug"
    | "name"
    | "address"
    | "formattedAddress"
    | "city"
    | "canonicalVenueId"
  >,
): VenueSelectOption {
  return {
    id: venue.id,
    slug: venue.slug,
    name: venue.name,
    address: venue.address,
    formattedAddress: venue.formattedAddress,
    city: venue.city,
    canonicalVenueId: venue.canonicalVenueId,
  };
}
