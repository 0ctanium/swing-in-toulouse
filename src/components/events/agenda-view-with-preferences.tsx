import { cookies } from "next/headers";

import { AgendaView } from "@/components/events/agenda-view";
import {
  AGENDA_PREFERENCES_COOKIE,
  parseAgendaPreferences,
} from "@/lib/events/agenda-preferences";

export async function AgendaViewWithPreferences() {
  const cookieStore = await cookies();
  const preferencesCookie = cookieStore.get(AGENDA_PREFERENCES_COOKIE)?.value;
  const initialPreferences = parseAgendaPreferences(preferencesCookie);

  return (
    <AgendaView
      initialPreferences={initialPreferences}
      hasStoredPreferences={Boolean(preferencesCookie)}
    />
  );
}
