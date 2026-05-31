import Link from "next/link";
import { MapPin } from "lucide-react";

import { CalendarSubscribeDialog } from "@/components/calendar/calendar-subscribe-dialog";
import { OrganizationCategoryBadge } from "@/components/organizations/organization-category-badge";
import type { Organization, Venue } from "@/db/schema";
import { emptyIcalPayload } from "@/lib/ical/payload";
import { getVenueDisplayAddress, getVenueMapsUrl } from "@/lib/venues/display";

type OrganizerHeaderProps = {
  organizer: Pick<
    Organization,
    "name" | "description" | "website" | "slug" | "category"
  >;
  venue: Venue | null;
};

export function OrganizerHeader({ organizer, venue }: OrganizerHeaderProps) {
  const displayAddress = venue ? getVenueDisplayAddress(venue) : null;
  const mapsUrl = venue ? getVenueMapsUrl(venue) : null;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          {organizer.name}
        </h1>
        <OrganizationCategoryBadge category={organizer.category} />
      </div>

      {organizer.description ? (
        <p className="text-muted-foreground max-w-2xl text-lg">
          {organizer.description}
        </p>
      ) : null}

      {venue && displayAddress ? (
        <div className="flex flex-col gap-2">
          <p className="text-muted-foreground inline-flex items-start gap-2 text-lg">
            <MapPin className="mt-1 size-5 shrink-0" aria-hidden />
            <Link href={`/lieu/${venue.slug}`} className="hover:underline">
              {displayAddress}
            </Link>
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
      ) : null}

      <div className="flex flex-wrap gap-3">
        {organizer.website ? (
          <a
            href={organizer.website}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted"
          >
            Site web
          </a>
        ) : null}
        <CalendarSubscribeDialog
          payload={{ ...emptyIcalPayload(), org: [organizer.slug] }}
          feedName={`${organizer.name} | Swing in Toulouse`}
        >
          <button className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-medium transition-colors hover:bg-muted">
            Calendrier iCal
          </button>
        </CalendarSubscribeDialog>
      </div>
    </section>
  );
}
