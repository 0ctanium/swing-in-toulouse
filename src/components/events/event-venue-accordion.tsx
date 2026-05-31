import { ChevronDown, MapPin } from "lucide-react";

import { VenueDetailsSection } from "@/components/venues/venue-details-section";
import type { VenueDetailsFields } from "@/lib/venues/enrichment";
import { cn } from "@/lib/utils";

type EventVenueAccordionProps = {
  venue: VenueDetailsFields;
};

export function EventVenueAccordion({ venue }: EventVenueAccordionProps) {
  return (
    <details
      className={cn(
        "group rounded-xl bg-card ring-1 ring-foreground/10",
        "[&_summary::-webkit-details-marker]:hidden",
      )}
    >
      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 font-medium select-none">
        <ChevronDown
          className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
          aria-hidden
        />
        <MapPin className="size-5 shrink-0 text-muted-foreground" aria-hidden />
        <span className="font-heading text-lg font-semibold">Le lieu</span>
        <span className="text-muted-foreground truncate text-sm font-normal">
          {venue.name}
        </span>
      </summary>
      <div className="border-t px-4 pt-2 pb-4">
        <VenueDetailsSection
          venue={venue}
          linkToVenuePage
          showHeading={false}
          showVenueTitle={false}
        />
      </div>
    </details>
  );
}
