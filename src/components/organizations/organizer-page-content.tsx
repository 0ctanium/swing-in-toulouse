import { Suspense } from "react";
import { notFound } from "next/navigation";

import { OrganizerHeader } from "@/components/organizations/organizer-header";
import { OrganizerUpcomingEvents } from "@/components/organizations/organizer-upcoming-events";
import { VenueDetailsSection } from "@/components/venues/venue-details-section";
import { EventListSkeleton } from "@/components/events/event-list-skeleton";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { breadcrumbJsonLd, JsonLd } from "@/components/seo/json-ld";
import { Skeleton } from "@/components/ui/skeleton";
import { getOrganizerProfile } from "@/lib/events/queries";
import {
  organizerBreadcrumbs,
  organizationStructuredData,
} from "@/lib/seo/structured-data";

type OrganizerPageContentProps = {
  params: Promise<{ slug: string }>;
};

export function OrganizerPageSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-28 w-full rounded-xl" />
    </div>
  );
}

export async function OrganizerPageContent({
  params,
}: OrganizerPageContentProps) {
  const { slug } = await params;
  const organizer = await getOrganizerProfile(slug);

  if (!organizer) {
    notFound();
  }

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          ...organizationStructuredData(organizer),
        }}
      />
      <JsonLd data={breadcrumbJsonLd(organizerBreadcrumbs(organizer))} />
      <div className="flex flex-col gap-8">
        <Breadcrumbs items={organizerBreadcrumbs(organizer)} />
        <OrganizerHeader organizer={organizer} />

        {organizer.venue ? (
          <VenueDetailsSection venue={organizer.venue} linkToVenuePage />
        ) : null}

        <Suspense fallback={<EventListSkeleton />}>
          <OrganizerUpcomingEvents slug={slug} />
        </Suspense>
      </div>
    </>
  );
}
