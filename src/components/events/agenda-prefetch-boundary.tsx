import { cookies } from "next/headers";
import { dehydrate } from "@tanstack/react-query";

import { AgendaHydration } from "@/components/events/agenda-hydration";
import {
  AgendaView,
  AgendaViewSkeleton,
} from "@/components/events/agenda-view";
import {
  mergeAgendaDisplayConfig,
  resolveAgendaPreferencesForDisplay,
  type AgendaDisplayConfig,
} from "@/lib/events/agenda-display-config";
import {
  AGENDA_PREFERENCES_COOKIE,
  AgendaPreferences,
  parseAgendaPreferences,
} from "@/lib/events/agenda-preferences";
import type { AgendaBaseFilters } from "@/lib/events/agenda-filters";
import { prefetchAgendaQueries } from "@/lib/events/prefetch-agenda-queries";
import { getQueryClient } from "@/lib/query/get-query-client";
import { Suspense } from "react";

export async function AgendaPrefetchBoundary({
  baseFilters,
  displayConfig: displayConfigInput,
  persistPreferences = true,
}: {
  baseFilters?: AgendaBaseFilters;
  displayConfig?: Partial<AgendaDisplayConfig>;
  persistPreferences?: boolean;
}) {
  const displayConfig = mergeAgendaDisplayConfig(displayConfigInput);
  const cookieStore = await cookies();
  const preferencesCookie = cookieStore.get(AGENDA_PREFERENCES_COOKIE)?.value;
  const initialPreferences = resolveAgendaPreferencesForDisplay(
    parseAgendaPreferences(preferencesCookie),
    displayConfig,
  );

  return (
    <Suspense
      fallback={
        <AgendaViewSkeleton
          preferences={initialPreferences}
          baseFilters={baseFilters}
          displayConfig={displayConfig}
        />
      }
    >
      <AgendaPrefetchBoundaryImpl
        initialPreferences={initialPreferences}
        baseFilters={baseFilters}
        displayConfig={displayConfig}
        persistPreferences={persistPreferences}
      />
    </Suspense>
  );
}

async function AgendaPrefetchBoundaryImpl({
  initialPreferences,
  baseFilters,
  displayConfig,
  persistPreferences,
}: {
  initialPreferences: AgendaPreferences;
  baseFilters?: AgendaBaseFilters;
  displayConfig: AgendaDisplayConfig;
  persistPreferences: boolean;
}) {
  const queryClient = getQueryClient();
  await prefetchAgendaQueries(queryClient, initialPreferences);

  return (
    <AgendaHydration state={dehydrate(queryClient)}>
      <AgendaView
        initialPreferences={initialPreferences}
        baseFilters={baseFilters}
        displayConfig={displayConfig}
        persistPreferences={persistPreferences}
      />
    </AgendaHydration>
  );
}
