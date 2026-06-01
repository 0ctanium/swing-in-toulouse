import Link from "next/link";

import { VenueCategoryBadge } from "@/components/venues/venue-category-badge";
import type { Venue } from "@/db/schema";
import { getVenueDisplayAddress } from "@/lib/venues/display";

type VenuesIndexProps = {
  venues: Array<
    Pick<
      Venue,
      | "id"
      | "name"
      | "slug"
      | "category"
      | "address"
      | "city"
      | "formattedAddress"
      | "addressConfirmedAt"
      | "latitude"
      | "longitude"
      | "locationKind"
    >
  >;
};

export function VenuesIndex({ venues }: VenuesIndexProps) {
  if (venues.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">Aucun lieu pour le moment.</p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {venues.map((venue) => {
        const displayAddress = getVenueDisplayAddress(venue);

        return (
          <li key={venue.id}>
            <article className="bg-card text-card-foreground rounded-xl border p-4 shadow-sm">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold">
                  <Link href={`/lieu/${venue.slug}`} className="hover:underline">
                    {venue.name}
                  </Link>
                </h2>
                <VenueCategoryBadge category={venue.category} />
              </div>
              {displayAddress ? (
                <p className="text-muted-foreground mt-2 text-sm">
                  {displayAddress}
                </p>
              ) : null}
            </article>
          </li>
        );
      })}
    </ul>
  );
}
