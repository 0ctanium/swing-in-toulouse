import type { Metadata } from "next";
import { Suspense } from "react";

import {
  EventCollectionPageContent,
  EventCollectionPageSkeleton,
} from "@/components/event-collections/event-collection-page-content";
import {
  collectionPageDescription,
  collectionPageTitle,
} from "@/lib/event-collections/metadata";
import { resolveEvenementsCollectionMeta } from "@/lib/event-collections/resolve";
import { publicMetadata } from "@/lib/metadata";
import { generateEventCollectionStaticParams } from "@/lib/static-params";

export { generateEventCollectionStaticParams as generateStaticParams };

type EventCollectionPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: EventCollectionPageProps): Promise<Metadata> {
  const { slug } = await params;
  const collection = await resolveEvenementsCollectionMeta(slug);

  if (!collection) {
    return { title: "Page introuvable" };
  }

  return publicMetadata({
    title: collectionPageTitle(collection),
    description: collectionPageDescription(collection),
    path: collection.path,
  });
}

export default function EventCollectionPage(props: EventCollectionPageProps) {
  return (
    <Suspense fallback={<EventCollectionPageSkeleton />}>
      <EventCollectionPageContent {...props} />
    </Suspense>
  );
}
