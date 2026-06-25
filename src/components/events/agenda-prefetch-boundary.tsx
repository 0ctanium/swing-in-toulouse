import { cookies } from "next/headers";
import { dehydrate } from "@tanstack/react-query";

import { AgendaHydration } from "@/components/events/agenda-hydration";
import { AgendaView } from "@/components/events/agenda-view";
import {
  AGENDA_PREFERENCES_COOKIE,
  parseAgendaPreferences,
} from "@/lib/events/agenda-preferences";
import { prefetchAgendaQueries } from "@/lib/events/prefetch-agenda-queries";
import { getQueryClient } from "@/lib/query/get-query-client";

export async function AgendaPrefetchBoundary() {
  const cookieStore = await cookies();
  const preferencesCookie = cookieStore.get(AGENDA_PREFERENCES_COOKIE)?.value;
  const initialPreferences = parseAgendaPreferences(preferencesCookie);

  const queryClient = getQueryClient();
  void prefetchAgendaQueries(queryClient);

  return (
    <AgendaHydration state={dehydrate(queryClient)}>
      <AgendaView
        initialPreferences={initialPreferences}
        hasStoredPreferences={Boolean(preferencesCookie)}
      />
    </AgendaHydration>
  );
}
