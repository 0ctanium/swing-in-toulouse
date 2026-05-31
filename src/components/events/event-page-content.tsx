import { notFound, redirect } from "next/navigation";

import { CalendarSubscribeDialog } from "@/components/calendar/calendar-subscribe-dialog";
import {
  EventActionLinks,
  EventBadges,
  EventDateLine,
  EventDescriptionBlock,
  EventLocationLine,
} from "@/components/events/event-details";
import { EventPageAdminSlot } from "@/components/events/event-page-admin-slot";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { resolveEventBySlug } from "@/lib/events/queries";
import { emptyIcalPayload } from "@/lib/ical/payload";
import { CalendarPlus } from "lucide-react";
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

  return (
    <article className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <EventBadges event={event} />
        <h1 className="font-heading text-4xl font-semibold tracking-tight">
          {event.title}
        </h1>
        <p className="text-muted-foreground text-lg">
          <EventDateLine event={event} />
        </p>
      </div>

      <EventLocationLine event={event} className="text-base" />

      {event.description ? (
        <EventDescriptionBlock
          description={event.description}
          className="prose prose-neutral dark:prose-invert max-w-none text-base"
        />
      ) : null}

      {event.source?.name ? (
        <p className="text-muted-foreground text-sm">
          Source : {event.source.name}
        </p>
      ) : null}

      <Separator />

      <Suspense fallback={null}>
        <EventPageAdminSlot masterEventId={event.id} />
      </Suspense>

      <div className="flex flex-wrap gap-3">
        <CalendarSubscribeDialog
          payload={{ ...emptyIcalPayload(), event: [event.slug] }}
          feedName={event.title}
          title="Ajouter au calendrier"
          description="Choisissez votre application pour ajouter cet événement."
        >
          <Button
            nativeButton={false}
            render={<a href={`/evenement/${event.slug}.ics`} download />}
          >
            <CalendarPlus data-icon="inline-start" />
            Ajouter au calendrier
          </Button>
        </CalendarSubscribeDialog>
        <EventActionLinks event={event} />
        {event.organization?.website ? (
          <Button
            variant="outline"
            render={
              <a
                href={event.organization.website}
                target="_blank"
                rel="noreferrer"
              />
            }
          >
            Site de {event.organization.name}
          </Button>
        ) : null}
      </div>
    </article>
  );
}

export function EventPageWithSuspense(props: EventPageContentProps) {
  return (
    <Suspense fallback={<EventPageSkeleton />}>
      <EventPageContent {...props} />
    </Suspense>
  );
}
