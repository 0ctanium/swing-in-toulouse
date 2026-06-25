import type { Metadata } from "next";
import { Suspense } from "react";

import {
  VenuePageContent,
  VenuePageSkeleton,
} from "@/components/venues/venue-page-content";
import { getVenueBySlug, resolveVenueBySlug } from "@/lib/events/queries";
import { publicMetadata } from "@/lib/metadata";
import { generateVenueStaticParams } from "@/lib/static-params";

export { generateVenueStaticParams as generateStaticParams };
import { getVenueDisplayAddress } from "@/lib/venues/display";

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
      ? `Événements swing à ${venue.name} - ${displayAddress}.`
      : `Événements swing à ${venue.name}, ${venue.city}.`,
    path: `/lieu/${canonicalSlug}`,
  });
}

export default function VenuePage(props: VenuePageProps) {
  return (
    <Suspense fallback={<VenuePageSkeleton />}>
      <VenuePageContent {...props} />
    </Suspense>
  );
}
