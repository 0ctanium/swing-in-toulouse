import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { EventsTable } from "@/components/admin/events-table";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { parseAdminEventsSearchParams } from "@/lib/events/admin-events-params";
import {
  getAdminEventsFilterOptions,
  listAdminEventsTable,
} from "@/lib/events/admin-events-table";
import { adminMetadata } from "@/lib/metadata";
import { requireAdminDataScope } from "@/lib/admin/access";

export const metadata: Metadata = adminMetadata({
  title: "Événements",
  description:
    "Liste des événements synchronisés ou créés manuellement — corrections et modération.",
});

type AdminEventsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function AdminEventsPageSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-96 w-full rounded-xl" />
    </div>
  );
}

async function AdminEventsPageContent({ searchParams }: AdminEventsPageProps) {
  const dataScope = await requireAdminDataScope();
  const resolvedSearchParams = await searchParams;
  const query = parseAdminEventsSearchParams(resolvedSearchParams);

  const [eventsTable, filterOptions] = await Promise.all([
    listAdminEventsTable(query, dataScope),
    getAdminEventsFilterOptions(dataScope),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-semibold">Événements</h1>
          <p className="text-muted-foreground mt-1 max-w-2xl">
            Événements synchronisés depuis iCal ou créés manuellement. Les
            événements à venir sont listés en premier, les événements passés en
            dernier.
          </p>
        </div>
        <Button nativeButton={false} render={<Link href="/admin/events/new" />}>
          Créer un événement
        </Button>
      </div>

      <EventsTable data={eventsTable} filterOptions={filterOptions} />
    </div>
  );
}

export default function AdminEventsPage(props: AdminEventsPageProps) {
  return (
    <Suspense fallback={<AdminEventsPageSkeleton />}>
      <AdminEventsPageContent {...props} />
    </Suspense>
  );
}
