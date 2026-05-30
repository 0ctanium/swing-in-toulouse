import type { Metadata } from "next";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { notFound } from "next/navigation";
import { CalendarPlus } from "lucide-react";

import {
  EventActionLinks,
  EventBadges,
  EventDateLine,
  EventDescriptionBlock,
  EventLocationLine,
} from "@/components/events/event-details";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getEventBySlug } from "@/lib/events/queries";

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

  return {
    title: `${event.title} – ${dateLabel}`,
    description:
      event.description ??
      `${event.title} à Toulouse le ${dateLabel}, proposé par ${organizerLabel(event)}.`,
    openGraph: {
      title: event.title,
      description: event.description ?? undefined,
      type: "website",
    },
  };
}

export default async function EventPage({ params }: EventPageProps) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);

  if (!event) {
    notFound();
  }

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

      <div className="flex flex-wrap gap-3">
        <Button render={<a href={`/evenement/${event.slug}.ics`} download />}>
          <CalendarPlus data-icon="inline-start" />
          Ajouter au calendrier
        </Button>
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
