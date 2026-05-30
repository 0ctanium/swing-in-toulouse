import type { Metadata } from "next";
import Link from "next/link";

import { AdminLogoutButton } from "@/components/admin/admin-logout-button";
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

type AdminHomePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminHomePage({ searchParams }: AdminHomePageProps) {
  const resolvedSearchParams = await searchParams;
  const query = parseAdminEventsSearchParams(resolvedSearchParams);

  const [eventsTable, filterOptions] = await Promise.all([
    listAdminEventsTable(query),
    getAdminEventsFilterOptions(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-semibold">Événements</h1>
          <p className="text-muted-foreground mt-1 max-w-2xl">
            Liste des événements synchronisés depuis iCal. Les événements à
            venir sont listés en premier, les événements passés en dernier.
          </p>
          <p className="mt-2 text-sm">
            <Link href="/agenda" className="font-medium underline">
              Voir l&apos;agenda
            </Link>
            {" · "}
            <Link href="/admin/events/confirm" className="font-medium underline">
              Confirmer les événements
            </Link>
            {" · "}
            <Link href="/admin/venues" className="font-medium underline">
              Corriger les lieux en masse
            </Link>
            {" · "}
            <Link href="/admin/sources" className="font-medium underline">
              Valeurs par défaut des sources
            </Link>
            {" · "}
            <Link href="/admin/organizations" className="font-medium underline">
              Organisateurs
            </Link>
          </p>
        </div>
        <AdminLogoutButton />
      </div>

      <EventsTable data={eventsTable} filterOptions={filterOptions} />
    </div>
  );
}
