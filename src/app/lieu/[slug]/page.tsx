import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EventList } from "@/components/events/event-list";
import { getVenueBySlug } from "@/lib/events/queries";

export const dynamic = "force-dynamic";

type VenuePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: VenuePageProps): Promise<Metadata> {
  const { slug } = await params;
  const venue = await getVenueBySlug(slug);

  if (!venue) {
    return { title: "Lieu introuvable" };
  }

  return {
    title: venue.name,
    description: `Événements swing à ${venue.name}, ${venue.city}.`,
  };
}

export default async function VenuePage({ params }: VenuePageProps) {
  const { slug } = await params;
  const venue = await getVenueBySlug(slug);

  if (!venue) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          {venue.name}
        </h1>
        {venue.address ? (
          <p className="text-muted-foreground text-lg">{venue.address}</p>
        ) : null}
        <p className="text-muted-foreground text-sm">{venue.city}</p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-heading text-2xl font-semibold">
          Prochains événements
        </h2>
        <EventList
          events={venue.events}
          emptyMessage="Aucun événement à venir dans ce lieu."
        />
      </section>
    </div>
  );
}
