import { notFound, redirect } from "next/navigation";
import Link from "next/link";

import { EventList } from "@/components/events/event-list";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { breadcrumbJsonLd, JsonLd } from "@/components/seo/json-ld";
import { Skeleton } from "@/components/ui/skeleton";
import { VenueHeader } from "@/components/venues/venue-header";
import { VenueOrganizersSection } from "@/components/venues/venue-organizers-section";
import {
  getVenueBySlug,
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

  const venue = await getVenueBySlug(resolution.venue.slug);

  if (!venue) {
    notFound();
  }

  const venueOrganizers = await listOrganizersForVenue(venue.id);
  const breadcrumbs = venueBreadcrumbs(venue);

  return (
    <>
      <JsonLd data={placeStructuredData(venue)} />
      <JsonLd data={breadcrumbJsonLd(breadcrumbs)} />
      <div className="flex flex-col gap-8">
        <Breadcrumbs items={breadcrumbs} />
        <VenueHeader venue={venue} />

        <VenueOrganizersSection organizers={venueOrganizers} />

        <section className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 className="font-heading text-2xl font-semibold">
              Prochains événements
            </h2>
            <Link href="/lieux" className="text-sm font-medium underline">
              Tous les lieux
            </Link>
          </div>
          <EventList
            events={venue.events}
            emptyMessage="Aucun événement à venir dans ce lieu."
          />
        </section>
      </div>
    </>
  );
}
