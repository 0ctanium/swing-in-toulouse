import type { Metadata } from "next";
import { cookies } from "next/headers";

import { AgendaView } from "@/components/events/agenda-view";
import {
  AGENDA_PREFERENCES_COOKIE,
  parseAgendaPreferences,
} from "@/lib/events/agenda-preferences";
import { publicMetadata } from "@/lib/metadata";

export const metadata: Metadata = publicMetadata({
  title: "Agenda",
  description:
    "Calendrier complet des soirées, cours et stages swing à Toulouse.",
  path: "/agenda",
});

export default async function AgendaPage() {
  const cookieStore = await cookies();
  const preferencesCookie = cookieStore.get(AGENDA_PREFERENCES_COOKIE)?.value;
  const initialPreferences = parseAgendaPreferences(preferencesCookie);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold tracking-tight">
          Agenda swing
        </h1>
        <p className="text-muted-foreground mt-2">
          Vue calendrier par mois ou sur 4 semaines, ou liste chronologique dans le planning.
        </p>
      </div>
      <AgendaView
        initialPreferences={initialPreferences}
        hasStoredPreferences={Boolean(preferencesCookie)}
      />
    </div>
  );
}
