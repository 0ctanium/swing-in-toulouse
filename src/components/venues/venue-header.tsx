import { MapPin } from "lucide-react";

import { VenueCategoryBadge } from "@/components/venues/venue-category-badge";
import type { Venue } from "@/db/schema";
import { getVenueDisplayAddress, getVenueMapsUrl } from "@/lib/venues/display";

type VenueHeaderProps = {
  venue: Pick<
    Venue,
    | "name"
    | "address"
    | "city"
    | "category"
    | "formattedAddress"
    | "googlePlaceId"
    | "latitude"
    | "longitude"
    | "addressConfirmedAt"
  >;
};

export function VenueHeader({ venue }: VenueHeaderProps) {
  const displayAddress = getVenueDisplayAddress(venue);
  const mapsUrl = getVenueMapsUrl(venue);

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          {venue.name}
        </h1>
        <VenueCategoryBadge category={venue.category} />
      </div>

      {displayAddress ? (
        <div className="flex flex-col gap-2">
          <p className="text-muted-foreground inline-flex items-start gap-2 text-lg">
            <MapPin className="mt-1 size-5 shrink-0" aria-hidden />
            <span>{displayAddress}</span>
          </p>

          {mapsUrl ? (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="text-primary w-fit text-sm font-medium hover:underline"
            >
              Ouvrir dans Google Maps
            </a>
          ) : null}
        </div>
      ) : venue.city ? (
        <p className="text-muted-foreground text-lg">{venue.city}</p>
      ) : null}
    </section>
  );
}
