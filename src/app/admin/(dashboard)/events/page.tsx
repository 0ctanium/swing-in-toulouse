import type { Metadata } from "next";

import { EventsTable } from "@/components/admin/events-table";
import { parseAdminEventsSearchParams } from "@/lib/events/admin-events-params";
import {
  getAdminEventsFilterOptions,
  listAdminEventsTable,
} from "@/lib/events/admin-events-table";
import { adminMetadata } from "@/lib/metadata";

export const metadata: Metadata = adminMetadata({
  title: "Événements",
  description:
    "Liste des événements synchronisés depuis iCal — corrections et modération.",
});

export const dynamic = "force-dynamic";

type AdminEventsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminEventsPage({
  searchParams,
}: AdminEventsPageProps) {
  const resolvedSearchParams = await searchParams;
  const query = parseAdminEventsSearchParams(resolvedSearchParams);

  const [eventsTable, filterOptions] = await Promise.all([
    listAdminEventsTable(query),
    getAdminEventsFilterOptions(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold">Événements</h1>
        <p className="text-muted-foreground mt-1 max-w-2xl">
          Liste des événements synchronisés depuis iCal. Les événements à venir
          sont listés en premier, les événements passés en dernier.
        </p>
      </div>

      <EventsTable data={eventsTable} filterOptions={filterOptions} />
    </div>
  );
}
