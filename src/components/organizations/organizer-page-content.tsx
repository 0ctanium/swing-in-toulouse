import Link from "next/link";
import { notFound } from "next/navigation";

import { EventList } from "@/components/events/event-list";
import { OrganizerHeader } from "@/components/organizations/organizer-header";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { breadcrumbJsonLd, JsonLd } from "@/components/seo/json-ld";
import { Skeleton } from "@/components/ui/skeleton";
import { getOrganizerBySlug } from "@/lib/events/queries";
import {
  organizerBreadcrumbs,
  organizationStructuredData,
} from "@/lib/seo/structured-data";

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
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          ...organizationStructuredData(organizer),
        }}
      />
      <JsonLd data={breadcrumbJsonLd(organizerBreadcrumbs(organizer))} />
      <div className="flex flex-col gap-8">
        <Breadcrumbs items={organizerBreadcrumbs(organizer)} />
        <OrganizerHeader organizer={organizer} venue={organizer.venue} />

        <section className="flex flex-col gap-4">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 className="font-heading text-2xl font-semibold">
              Prochains événements
            </h2>
            <Link href="/organisateurs" className="text-sm font-medium underline">
              Tous les organisateurs
            </Link>
          </div>
          <EventList
            events={organizer.events}
            emptyMessage="Aucun événement à venir pour cet organisateur."
          />
        </section>
      </div>
    </>
  );
}
