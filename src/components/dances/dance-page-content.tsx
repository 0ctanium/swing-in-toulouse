import Link from "next/link";
import { notFound } from "next/navigation";

import { DanceHero } from "@/components/dances/dance-hero";
import { EventList } from "@/components/events/event-list";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { breadcrumbJsonLd, JsonLd } from "@/components/seo/json-ld";
import { Skeleton } from "@/components/ui/skeleton";
import {
  agendaCategoryUrl,
  getDanceTagPage,
} from "@/lib/event-category-tags/dance-pages";
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
  const page = await getDanceTagPage(slug);

  if (!page) {
    notFound();
  }

  const breadcrumbs = danceBreadcrumbs(page);

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(breadcrumbs)} />
      <div className="flex flex-col gap-8">
        <Breadcrumbs items={breadcrumbs} />
        <DanceHero tag={page} />

        <section className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 className="font-heading text-2xl font-semibold">
              Prochains événements
            </h2>
            <Link
              href={agendaCategoryUrl(page.name)}
              className="text-sm font-medium underline"
            >
              Voir dans l&apos;agenda
            </Link>
          </div>
          <EventList
            events={page.events}
            emptyMessage={`Aucun événement ${page.name} à venir pour le moment.`}
          />
        </section>
      </div>
    </>
  );
}
