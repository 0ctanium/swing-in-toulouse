import Link from "next/link";

import { AdminLogoutButton } from "@/components/admin/admin-logout-button";
import { AgendaView } from "@/components/events/agenda-view";
import { cookies } from "next/headers";
import {
  AGENDA_PREFERENCES_COOKIE,
  parseAgendaPreferences,
} from "@/lib/events/agenda-preferences";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const cookieStore = await cookies();
  const initialPreferences = parseAgendaPreferences(
    cookieStore.get(AGENDA_PREFERENCES_COOKIE)?.value,
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-semibold">Corrections</h1>
          <p className="text-muted-foreground mt-1 max-w-2xl">
            Même vue calendrier que le site public. Connectez-vous sur{" "}
            <Link href="/agenda" className="underline">
              /agenda
            </Link>{" "}
            pour corriger en contexte, ou utilisez ce calendrier admin.
          </p>
          <p className="mt-2 text-sm">
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
      <AgendaView initialPreferences={initialPreferences} />
    </div>
  );
}
