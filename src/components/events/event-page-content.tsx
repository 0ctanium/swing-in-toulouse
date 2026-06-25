import { notFound, redirect } from "next/navigation";

import { EventDescriptionMarkdown } from "@/components/events/event-description-markdown";
import {
  EventBadges,
  EventDateLine,
  EventLocationLine,
  EventOrganizerLine,
} from "@/components/events/event-details";
import { EventPageActions } from "@/components/events/event-page-actions";
import { EventListSkeleton } from "@/components/events/event-list-skeleton";
import { EventRelatedEvents } from "@/components/events/event-related-events";
import { VenueDetailsSection } from "@/components/venues/venue-details-section";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { breadcrumbJsonLd, JsonLd } from "@/components/seo/json-ld";
import { Skeleton } from "@/components/ui/skeleton";
import { resolveEventBySlug } from "@/lib/events/queries";
import {
  eventBreadcrumbs,
  eventStructuredData,
} from "@/lib/seo/structured-data";
import { Suspense } from "react";

type EventPageContentProps = {
  params: Promise<{ slug: string }>;
};

export function EventPageSkeleton() {
  return (
    <article className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-6 w-48" />
      </div>
      <Skeleton className="h-5 w-64" />
      <Skeleton className="h-24 w-full" />
    </article>
  );
}

async function EventPageContent({ params }: EventPageContentProps) {
  const { slug } = await params;
  const resolution = await resolveEventBySlug(slug);

  if (!resolution) {
    notFound();
  }

  if (resolution.kind === "redirect") {
    redirect(`/evenement/${resolution.targetSlug}`);
  }

  const event = resolution.event;
  const breadcrumbs = eventBreadcrumbs(event);

  return (
    <>
      <JsonLd data={eventStructuredData(event)} />
      <JsonLd data={breadcrumbJsonLd(breadcrumbs)} />
      <article className="flex flex-col gap-6">
        <Breadcrumbs items={breadcrumbs} />
        <div className="flex flex-col gap-3">
          <EventBadges event={event} />
          <h1 className="font-heading text-4xl font-semibold tracking-tight">
            {event.title}
          </h1>
          <p className="text-muted-foreground text-lg">
            <EventDateLine event={event} />
          </p>
          <EventOrganizerLine event={event} />
        </div>

        {!event.venue ? (
          <EventLocationLine event={event} className="text-base" />
        ) : null}

        <EventPageActions event={event} />

        {event.description ? (
          <EventDescriptionMarkdown description={event.description} />
        ) : null}

        {event.venue ? (
          <VenueDetailsSection venue={event.venue} linkToVenuePage />
        ) : null}

        <Suspense fallback={<EventListSkeleton cards={2} />}>
          <EventRelatedEvents
            slug={event.slug}
            organization={
              event.organization
                ? {
                    slug: event.organization.slug,
                    name: event.organization.name,
                  }
                : null
            }
            venue={
              event.venue
                ? { slug: event.venue.slug, name: event.venue.name }
                : null
            }
          />
        </Suspense>
      </article>
    </>
  );
}

export function EventPageWithSuspense(props: EventPageContentProps) {
  return (
    <Suspense fallback={<EventPageSkeleton />}>
      <EventPageContent {...props} />
    </Suspense>
  );
}
