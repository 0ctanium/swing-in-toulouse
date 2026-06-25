import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { EventList } from "@/components/events/event-list";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import {
  breadcrumbJsonLd,
  itemListJsonLd,
  JsonLd,
} from "@/components/seo/json-ld";
import { PaginationNav } from "@/components/seo/pagination-nav";
import {
  buildArchiveMonthPath,
  buildPaginatedPath,
  EVENTS_HUB_PAGE_SIZE,
  formatArchiveMonthLabel,
  paginateItems,
  parseArchiveMonthParams,
  parsePageParam,
} from "@/lib/events/hub";
import { listEventsInMonth } from "@/lib/events/queries";
import { archiveBreadcrumbs } from "@/lib/seo/structured-data";
import { absoluteUrl, eventUrl } from "@/lib/site";
import { publicMetadata } from "@/lib/metadata";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

type EventArchivePageProps = {
  params: Promise<{ year: string; month: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({
  params,
  searchParams,
}: EventArchivePageProps): Promise<Metadata> {
  const { year, month } = await params;
  const parsed = parseArchiveMonthParams(year, month);

  if (!parsed) {
    return { title: "Archive introuvable" };
  }

  const resolvedSearchParams = await searchParams;
  const page = parsePageParam(resolvedSearchParams.page);
  const basePath = buildArchiveMonthPath(parsed.year, parsed.month);
  const path = buildPaginatedPath(basePath, page);
  const events = await listEventsInMonth(parsed.year, parsed.month);
  const { totalPages } = paginateItems(events, page, EVENTS_HUB_PAGE_SIZE);
  const monthLabel = formatArchiveMonthLabel(parsed.year, parsed.month);

  return publicMetadata({
    title:
      page > 1
        ? `Événements de ${monthLabel} - page ${page}`
        : `Événements de ${monthLabel}`,
    description: `Archive des événements swing à Toulouse - ${monthLabel}.`,
    path,
    pagination: {
      ...(page > 1 && {
        previous: absoluteUrl(buildPaginatedPath(basePath, page - 1)),
      }),
      ...(page < totalPages && {
        next: absoluteUrl(buildPaginatedPath(basePath, page + 1)),
      }),
    },
  });
}

async function EventArchivePageContent({
  params,
  searchParams,
}: EventArchivePageProps) {
  const { year, month } = await params;
  const parsed = parseArchiveMonthParams(year, month);

  if (!parsed) {
    notFound();
  }

  const resolvedSearchParams = await searchParams;
  const page = parsePageParam(resolvedSearchParams.page);
  const events = await listEventsInMonth(parsed.year, parsed.month);
  const pagination = paginateItems(events, page, EVENTS_HUB_PAGE_SIZE);
  const basePath = buildArchiveMonthPath(parsed.year, parsed.month);
  const monthLabel = formatArchiveMonthLabel(parsed.year, parsed.month);
  const breadcrumbs = archiveBreadcrumbs(parsed.year, parsed.month, monthLabel);

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(breadcrumbs)} />
      <JsonLd
        data={itemListJsonLd({
          name: `Événements de ${monthLabel}`,
          path: basePath,
          items: pagination.items.map((event) => ({
            name: event.title,
            url: eventUrl(event.slug),
          })),
        })}
      />
      <div className="flex flex-col gap-6">
        <Breadcrumbs items={breadcrumbs} />
        <div>
          <h1 className="font-heading text-3xl font-semibold capitalize tracking-tight">
            {monthLabel}
          </h1>
          <p className="text-muted-foreground mt-2">
            {pagination.totalItems} événement
            {pagination.totalItems > 1 ? "s" : ""} archivé
            {pagination.totalItems > 1 ? "s" : ""}.
          </p>
        </div>

        <EventList
          events={pagination.items}
          emptyMessage="Aucun événement archivé pour ce mois."
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
      </div>
    </>
  );
}

function EventArchivePageSkeleton() {
  return (
    <div className="flex flex-col gap-8">
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-28 w-full rounded-xl" />
    </div>
  );
}

export default async function EventArchivePage({
  params,
  searchParams,
}: EventArchivePageProps) {
  return (
    <Suspense fallback={<EventArchivePageSkeleton />}>
      <EventArchivePageContent params={params} searchParams={searchParams} />
    </Suspense>
  );
}
