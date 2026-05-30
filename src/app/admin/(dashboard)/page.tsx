import Link from "next/link";

import { AdminLogoutButton } from "@/components/admin/admin-logout-button";
import { AgendaView } from "@/components/events/agenda-view";

export const dynamic = "force-dynamic";

export default function AdminHomePage() {
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
        </div>
        <AdminLogoutButton />
      </div>
      <AgendaView />
    </div>
  );
}
