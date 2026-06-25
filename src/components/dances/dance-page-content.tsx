import { Suspense } from "react";
import { notFound } from "next/navigation";

import { DanceHero } from "@/components/dances/dance-hero";
import { DanceUpcomingEvents } from "@/components/dances/dance-upcoming-events";
import { EventListSkeleton } from "@/components/events/event-list-skeleton";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { breadcrumbJsonLd, JsonLd } from "@/components/seo/json-ld";
import { Skeleton } from "@/components/ui/skeleton";
import { getPublishedDanceTagBySlug } from "@/lib/event-category-tags/dance-pages";
import { danceBreadcrumbs } from "@/lib/seo/structured-data";

type DancePageContentProps = {
  params: Promise<{ slug: string }>;
};

export function DancePageSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-28 w-full rounded-xl" />
    </div>
  );
}

export async function DancePageContent({ params }: DancePageContentProps) {
  const { slug } = await params;
  const tag = await getPublishedDanceTagBySlug(slug);

  if (!tag) {
    notFound();
  }

  const breadcrumbs = danceBreadcrumbs(tag);

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(breadcrumbs)} />
      <div className="flex flex-col gap-8">
        <Breadcrumbs items={breadcrumbs} />
        <DanceHero tag={tag} />

        <Suspense fallback={<EventListSkeleton />}>
          <DanceUpcomingEvents slug={slug} tag={tag} />
        </Suspense>
      </div>
    </>
  );
}
