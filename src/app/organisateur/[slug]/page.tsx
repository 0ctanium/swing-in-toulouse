import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EventList } from "@/components/events/event-list";
import { OrganizerHeader } from "@/components/organizations/organizer-header";
import { getOrganizerBySlug } from "@/lib/events/queries";
import { publicMetadata } from "@/lib/metadata";
import { formatOrganizationCategory } from "@/lib/organizations/categories";
import { getVenueDisplayAddress } from "@/lib/venues/display";

export const dynamic = "force-dynamic";

type OrganizerPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: OrganizerPageProps): Promise<Metadata> {
  const { slug } = await params;
  const organizer = await getOrganizerBySlug(slug);

  if (!organizer) {
    return { title: "Organisateur introuvable" };
  }

  const categoryLabel = formatOrganizationCategory(organizer.category);
  const venueAddress = organizer.venue
    ? getVenueDisplayAddress(organizer.venue)
    : null;

  return publicMetadata({
    title: organizer.name,
    description:
      organizer.description ??
      [
        categoryLabel ? `${categoryLabel} swing` : "Événements swing",
        `proposés par ${organizer.name}`,
        venueAddress ? `à ${venueAddress}` : "à Toulouse",
      ].join(" ") + ".",
    path: `/organisateur/${slug}`,
  });
}

export default async function OrganizerPage({ params }: OrganizerPageProps) {
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
