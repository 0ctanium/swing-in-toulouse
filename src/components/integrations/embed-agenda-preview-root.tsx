"use client";

import { useEffect, useState } from "react";

import { AgendaView } from "@/components/events/agenda-view";
import {
  resolveAgendaPreferencesForDisplay,
  type AgendaDisplayConfig,
} from "@/lib/events/agenda-display-config";
import type { AgendaBaseFilters } from "@/lib/events/agenda-filters";
import { defaultAgendaPreferences } from "@/lib/events/agenda-preferences";

type EmbedAgendaPreviewRootProps = {
  baseFilters?: AgendaBaseFilters;
  displayConfig: AgendaDisplayConfig;
};

export function EmbedAgendaPreviewRoot({
  baseFilters,
  displayConfig,
}: EmbedAgendaPreviewRootProps) {
  const [preferences, setPreferences] = useState(() =>
    resolveAgendaPreferencesForDisplay(
      defaultAgendaPreferences,
      displayConfig,
    ),
  );

  useEffect(() => {
    setPreferences((current) =>
      resolveAgendaPreferencesForDisplay(current, displayConfig),
    );
  }, [displayConfig]);

  return (
    <AgendaView
      baseFilters={baseFilters}
      displayConfig={displayConfig}
      initialPreferences={preferences}
      persistPreferences={false}
    />
  );
}
