import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";

import { EventListSkeleton } from "@/components/events/event-list-skeleton";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { breadcrumbJsonLd, JsonLd } from "@/components/seo/json-ld";
import { Skeleton } from "@/components/ui/skeleton";
import { VenueDetailsSection } from "@/components/venues/venue-details-section";
import { VenueHeader } from "@/components/venues/venue-header";
import { VenueOrganizersSection } from "@/components/venues/venue-organizers-section";
import { VenueUpcomingEvents } from "@/components/venues/venue-upcoming-events";
import {
  listOrganizersForVenue,
  resolveVenueBySlug,
} from "@/lib/events/queries";
import { placeStructuredData, venueBreadcrumbs } from "@/lib/seo/structured-data";

type VenuePageContentProps = {
  params: Promise<{ slug: string }>;
};

export function VenuePageSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-28 w-full rounded-xl" />
    </div>
  );
}

export async function VenuePageContent({ params }: VenuePageContentProps) {
  const { slug } = await params;
  const resolution = await resolveVenueBySlug(slug);

  if (!resolution) {
    notFound();
  }

  if (resolution.kind === "redirect") {
    redirect(`/lieu/${resolution.targetSlug}`);
  }

  const venue = resolution.venue;
  const venueOrganizers = await listOrganizersForVenue(venue.id);
  const breadcrumbs = venueBreadcrumbs(venue);

  return (
    <>
      <JsonLd data={placeStructuredData(venue)} />
      <JsonLd data={breadcrumbJsonLd(breadcrumbs)} />
      <div className="flex flex-col gap-8">
        <Breadcrumbs items={breadcrumbs} />
        <VenueHeader venue={venue} />

        <VenueDetailsSection venue={venue} />

        <VenueOrganizersSection organizers={venueOrganizers} />

        <Suspense fallback={<EventListSkeleton />}>
          <VenueUpcomingEvents slug={venue.slug} />
        </Suspense>
      </div>
    </>
  );
}
