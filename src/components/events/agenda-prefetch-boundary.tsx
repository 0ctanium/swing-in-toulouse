import { cookies } from "next/headers";
import { dehydrate } from "@tanstack/react-query";

import { AgendaHydration } from "@/components/events/agenda-hydration";
import {
  AgendaView,
  AgendaViewSkeleton,
} from "@/components/events/agenda-view";
import {
  AGENDA_PREFERENCES_COOKIE,
  AgendaPreferences,
  parseAgendaPreferences,
} from "@/lib/events/agenda-preferences";
import { prefetchAgendaQueries } from "@/lib/events/prefetch-agenda-queries";
import { getQueryClient } from "@/lib/query/get-query-client";
import { Suspense } from "react";

export async function AgendaPrefetchBoundary() {
  const cookieStore = await cookies();
  const preferencesCookie = cookieStore.get(AGENDA_PREFERENCES_COOKIE)?.value;
  const initialPreferences = parseAgendaPreferences(preferencesCookie);

  return (
    <Suspense
      fallback={<AgendaViewSkeleton preferences={initialPreferences} />}
    >
      <AgendaPrefetchBoundaryImpl initialPreferences={initialPreferences} />
    </Suspense>
  );
}

async function AgendaPrefetchBoundaryImpl({
  initialPreferences,
}: {
  initialPreferences: AgendaPreferences;
}) {
  const queryClient = getQueryClient();
  await prefetchAgendaQueries(queryClient, initialPreferences);

  return (
    <AgendaHydration state={dehydrate(queryClient)}>
      <AgendaView initialPreferences={initialPreferences} />
    </AgendaHydration>
  );
}
