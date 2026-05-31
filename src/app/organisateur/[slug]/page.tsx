import type { Metadata } from "next";
import { Suspense } from "react";

import {
  OrganizerPageContent,
  OrganizerPageSkeleton,
} from "@/components/organizations/organizer-page-content";
import { getOrganizerBySlug } from "@/lib/events/queries";
import { publicMetadata } from "@/lib/metadata";
import { formatOrganizationCategory } from "@/lib/organizations/categories";
import { getVenueDisplayAddress } from "@/lib/venues/display";

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

export default function OrganizerPage(props: OrganizerPageProps) {
  return (
    <Suspense fallback={<OrganizerPageSkeleton />}>
      <OrganizerPageContent {...props} />
    </Suspense>
  );
}
