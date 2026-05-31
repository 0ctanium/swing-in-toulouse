import { notFound } from "next/navigation";

import { EventList } from "@/components/events/event-list";
import { OrganizerHeader } from "@/components/organizations/organizer-header";
import { Skeleton } from "@/components/ui/skeleton";
import { getOrganizerBySlug } from "@/lib/events/queries";

type OrganizerPageContentProps = {
  params: Promise<{ slug: string }>;
};

export function OrganizerPageSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-28 w-full rounded-xl" />
    </div>
  );
}

export async function OrganizerPageContent({
  params,
}: OrganizerPageContentProps) {
  const { slug } = await params;
  const organizer = await getOrganizerBySlug(slug);

  if (!organizer) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-8">
      <OrganizerHeader organizer={organizer} venue={organizer.venue} />

      <section className="flex flex-col gap-4">
        <h2 className="font-heading text-2xl font-semibold">
          Prochains événements
        </h2>
        <EventList
          events={organizer.events}
          emptyMessage="Aucun événement à venir pour cet organisateur."
        />
      </section>
    </div>
  );
}
