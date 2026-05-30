import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { EventList } from "@/components/events/event-list";
import { VenueHeader } from "@/components/venues/venue-header";
import { getVenueBySlug, resolveVenueBySlug } from "@/lib/events/queries";
import { publicMetadata } from "@/lib/metadata";
import { getVenueDisplayAddress } from "@/lib/venues/display";

export const dynamic = "force-dynamic";

type VenuePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: VenuePageProps): Promise<Metadata> {
  const { slug } = await params;
  const resolution = await resolveVenueBySlug(slug);

  if (!resolution) {
    return { title: "Lieu introuvable" };
  }

  const venue =
    resolution.kind === "redirect"
      ? await getVenueBySlug(resolution.targetSlug)
      : resolution.venue;

  if (!venue) {
    return { title: "Lieu introuvable" };
  }

  const displayAddress = getVenueDisplayAddress(venue);
  const canonicalSlug =
    resolution.kind === "redirect" ? resolution.targetSlug : slug;

  return publicMetadata({
    title: venue.name,
    description: displayAddress
      ? `Événements swing à ${venue.name} — ${displayAddress}.`
      : `Événements swing à ${venue.name}, ${venue.city}.`,
    path: `/lieu/${canonicalSlug}`,
  });
}

export default async function VenuePage({ params }: VenuePageProps) {
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

  return (
    <div className="flex flex-col gap-8">
      <VenueHeader venue={venue} />

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
