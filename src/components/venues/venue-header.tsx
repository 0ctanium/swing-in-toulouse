import { VenueCategoryBadge } from "@/components/venues/venue-category-badge";
import type { Venue } from "@/db/schema";

type VenueHeaderProps = {
  venue: Pick<Venue, "name" | "category">;
};

export function VenueHeader({ venue }: VenueHeaderProps) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          {venue.name}
        </h1>
        <VenueCategoryBadge category={venue.category} />
      </div>
    </section>
  );
}
