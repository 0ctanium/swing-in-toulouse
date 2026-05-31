import type { Metadata } from "next";
import Link from "next/link";

import { EventArchiveSection } from "@/components/events/event-archive-section";
import { EventList } from "@/components/events/event-list";
import { PaginationNav } from "@/components/seo/pagination-nav";
import {
  buildPaginatedPath,
  EVENTS_HUB_PAGE_SIZE,
  paginateItems,
  parsePageParam,
} from "@/lib/events/hub";
import {
  listEventArchiveMonths,
  listUpcomingEventsForHub,
} from "@/lib/events/queries";
import { absoluteUrl } from "@/lib/site";
import { publicMetadata } from "@/lib/metadata";

type EventsIndexPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({
  searchParams,
}: EventsIndexPageProps): Promise<Metadata> {
  const resolvedSearchParams = await searchParams;
  const page = parsePageParam(resolvedSearchParams.page);
  const path = buildPaginatedPath("/evenements", page);
  const events = await listUpcomingEventsForHub();
  const { totalPages } = paginateItems(events, page, EVENTS_HUB_PAGE_SIZE);

  return publicMetadata({
    title: page > 1 ? `Événements — page ${page}` : "Événements",
    description:
      "Liste des prochains événements swing à Toulouse : soirées, cours, stages et festivals.",
    path,
    pagination: {
      ...(page > 1 && {
        previous: absoluteUrl(buildPaginatedPath("/evenements", page - 1)),
      }),
      ...(page < totalPages && {
        next: absoluteUrl(buildPaginatedPath("/evenements", page + 1)),
      }),
    },
  });
}

export default async function EventsIndexPage({
  searchParams,
}: EventsIndexPageProps) {
  const resolvedSearchParams = await searchParams;
  const page = parsePageParam(resolvedSearchParams.page);
  const [events, archiveMonths] = await Promise.all([
    listUpcomingEventsForHub(),
    listEventArchiveMonths(),
  ]);
  const pagination = paginateItems(events, page, EVENTS_HUB_PAGE_SIZE);
  const basePath = "/evenements";

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Événements
        </h1>
        <p className="text-muted-foreground mt-2">
          Prochains événements swing à Toulouse. Pour la vue calendrier, consultez
          l&apos;{" "}
          <Link href="/agenda" className="text-foreground underline">
            agenda
          </Link>
          .
        </p>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="font-heading text-2xl font-semibold">À venir</h2>
        <EventList
          events={pagination.items}
          emptyMessage="Aucun événement à venir pour le moment."
        />
        <PaginationNav
          page={pagination.page}
          totalPages={pagination.totalPages}
          previousHref={
            pagination.page > 1
              ? buildPaginatedPath(basePath, pagination.page - 1)
              : undefined
          }
          nextHref={
            pagination.page < pagination.totalPages
              ? buildPaginatedPath(basePath, pagination.page + 1)
              : undefined
          }
        />
      </section>

      <EventArchiveSection months={archiveMonths} />
    </div>
  );
}
