import { notFound, redirect } from "next/navigation";

import { EventList } from "@/components/events/event-list";
import { Skeleton } from "@/components/ui/skeleton";
import { VenueHeader } from "@/components/venues/venue-header";
import { getVenueBySlug, resolveVenueBySlug } from "@/lib/events/queries";

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
