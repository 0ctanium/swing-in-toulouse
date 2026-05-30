import type { Metadata } from "next";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarPlus, MapPin } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatEventDate } from "@/lib/events/format";
import { getEventBySlug } from "@/lib/events/queries";

export const dynamic = "force-dynamic";

type EventPageProps = {
  params: Promise<{ slug: string }>;
};

function organizerLabel(event: NonNullable<Awaited<ReturnType<typeof getEventBySlug>>>) {
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

  const dateLabel = formatEventDate(
    event.startAt,
    event.endAt ?? null,
    event.isAllDay,
  );
  const location = event.venue?.name ?? event.locationRaw;

  return (
    <article className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {event.organization ? (
            <Badge variant="secondary">
              <Link href={`/organisateur/${event.organization.slug}`}>
                {event.organization.name}
              </Link>
            </Badge>
          ) : (
            <Badge variant="outline">{event.source.name}</Badge>
          )}
          {event.status === "cancelled" ? (
            <Badge variant="destructive">Annulé</Badge>
          ) : null}
          {event.categories?.map((category) => (
            <Badge key={category} variant="outline">
              {category}
            </Badge>
          ))}
        </div>
        <h1 className="font-heading text-4xl font-semibold tracking-tight">
          {event.title}
        </h1>
        <p className="text-muted-foreground text-lg">{dateLabel}</p>
      </div>

      {location ? (
        <p className="inline-flex items-center gap-2 text-base">
          <MapPin />
          {event.venue ? (
            <Link href={`/lieu/${event.venue.slug}`} className="underline">
              {location}
            </Link>
          ) : (
            location
          )}
        </p>
      ) : null}

      {event.description ? (
        <div className="prose prose-neutral dark:prose-invert max-w-none whitespace-pre-wrap">
          {event.description}
        </div>
      ) : null}

      <Separator />

      <div className="flex flex-wrap gap-3">
        <Button render={<a href={`/evenement/${event.slug}.ics`} download />}>
          <CalendarPlus data-icon="inline-start" />
          Ajouter au calendrier
        </Button>
        {event.sourceUrl ? (
          <Button
            variant="outline"
            render={
              <a href={event.sourceUrl} target="_blank" rel="noreferrer" />
            }
          >
            Lien externe
          </Button>
        ) : null}
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
