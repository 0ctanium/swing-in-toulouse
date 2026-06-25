import { Suspense } from "react";
import { notFound } from "next/navigation";

import { CollectionHero } from "@/components/event-collections/collection-hero";
import { CollectionUpcomingEvents } from "@/components/event-collections/collection-upcoming-events";
import { EventListSkeleton } from "@/components/events/event-list-skeleton";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { breadcrumbJsonLd, JsonLd } from "@/components/seo/json-ld";
import { Skeleton } from "@/components/ui/skeleton";
import { getEvenementsCollectionPage } from "@/lib/event-collections/queries";
import { evenementsCollectionBreadcrumbs } from "@/lib/seo/structured-data";

type EventCollectionPageContentProps = {
  params: Promise<{ slug: string }>;
};

export function EventCollectionPageSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-28 w-full rounded-xl" />
    </div>
  );
}

export async function EventCollectionPageContent({
  params,
}: EventCollectionPageContentProps) {
  const { slug } = await params;
  const page = await getEvenementsCollectionPage(slug);

  if (!page) {
    notFound();
  }

  const breadcrumbs = evenementsCollectionBreadcrumbs(page);

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(breadcrumbs)} />
      <div className="flex flex-col gap-8">
        <Breadcrumbs items={breadcrumbs} />
        <CollectionHero collection={page} />

        <Suspense fallback={<EventListSkeleton />}>
          <CollectionUpcomingEvents page={page} />
        </Suspense>
      </div>
    </>
  );
}
