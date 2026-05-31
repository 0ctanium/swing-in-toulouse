import type { Metadata } from "next";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { notFound, redirect } from "next/navigation";

import { CalendarSubscribeDialog } from "@/components/calendar/calendar-subscribe-dialog";
import {
  EventActionLinks,
  EventBadges,
  EventDateLine,
  EventDescriptionBlock,
  EventLocationLine,
} from "@/components/events/event-details";
import { AdminEventActions } from "@/components/admin/admin-event-actions";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { isAdminAuthenticated } from "@/lib/admin/auth";
import { getEventWithOverrides } from "@/lib/events/overrides";
import { getEventBySlug, resolveEventBySlug } from "@/lib/events/queries";
import { emptyIcalPayload } from "@/lib/ical/payload";
import { publicMetadata } from "@/lib/metadata";
import { CalendarPlus } from "lucide-react";

export const dynamic = "force-dynamic";

type EventPageProps = {
  params: Promise<{ slug: string }>;
};

function organizerLabel(
  event: NonNullable<Awaited<ReturnType<typeof getEventBySlug>>>,
) {
  return event.organization?.name ?? event.source.name;
}

export async function generateMetadata({
  params,
}: EventPageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);

  if (!event) {
    return { title: "Événement introuvable" };
  }

  const dateLabel = format(event.startAt, "d MMMM yyyy", { locale: fr });
  const title = `${event.title} – ${dateLabel}`;
  const description =
    event.description ??
    `${event.title} à Toulouse le ${dateLabel}, proposé par ${organizerLabel(event)}.`;

  return publicMetadata({
    title,
    description,
    path: `/evenement/${slug}`,
  });
}

export default async function EventPage({ params }: EventPageProps) {
  const { slug } = await params;
  const resolution = await resolveEventBySlug(slug);

  if (!resolution) {
    notFound();
  }

  if (resolution.kind === "redirect") {
    redirect(`/evenement/${resolution.targetSlug}`);
  }

  const event = resolution.event;

  const isAdmin = await isAdminAuthenticated();
  const overrideInfo = isAdmin ? await getEventWithOverrides(event.id) : null;
  const overrideCount =
    (overrideInfo?.masterOverride ? 1 : 0) +
    (overrideInfo?.occurrenceOverrides.length ?? 0);

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

      {isAdmin ? (
        <AdminEventActions
          masterEventId={event.id}
          admin={{
            masterOverridden: Boolean(overrideInfo?.masterOverride),
            occurrenceOverridden: false,
            overrideCount,
          }}
        />
      ) : null}

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
