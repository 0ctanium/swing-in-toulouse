import type { Metadata } from "next";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import {
  EventPageWithSuspense,
} from "@/components/events/event-page-content";
import { getEventBySlug } from "@/lib/events/queries";
import { publicMetadata } from "@/lib/metadata";

type EventPageProps = {
  params: Promise<{ slug: string }>;
};

function organizerLabel(
  event: NonNullable<Awaited<ReturnType<typeof getEventBySlug>>>,
) {
  return event.organization?.name ?? null;
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
  const organizer = organizerLabel(event);
  const description =
    event.description ??
    (organizer
      ? `${event.title} à Toulouse le ${dateLabel}, proposé par ${organizer}.`
      : `${event.title} à Toulouse le ${dateLabel}.`);

  return publicMetadata({
    title,
    description,
    path: `/evenement/${slug}`,
  });
}

export default function EventPage(props: EventPageProps) {
  return <EventPageWithSuspense {...props} />;
}
