"use client";

import { useEffect, useState } from "react";

import { AgendaViewSkeleton } from "@/components/events/agenda-view";
import { EmbedAgendaPreviewRoot } from "@/components/integrations/embed-agenda-preview-root";
import { EmbedIntegrationChrome } from "@/components/integrations/embed-integration-chrome";
import type { AgendaBaseFilters } from "@/lib/events/agenda-filters";
import {
  isIntegrationPreviewMessage,
  type IntegrationPreviewMessage,
} from "@/lib/integrations/embed-preview";
import {
  resolveEmbedAppearanceFromForm,
  type IntegrationAppearanceFormState,
  type ResolvedEmbedAppearance,
} from "@/lib/integrations/theme";

type EmbedPreviewShellProps = {
  organizationSlug: string;
  baseFilters?: AgendaBaseFilters;
  initialAppearanceForm: IntegrationAppearanceFormState;
};

export function EmbedPreviewShell({
  organizationSlug,
  baseFilters,
  initialAppearanceForm,
}: EmbedPreviewShellProps) {
  const [appearanceForm, setAppearanceForm] = useState(initialAppearanceForm);
  const appearance = resolveEmbedAppearanceFromForm(appearanceForm);

  useEffect(() => {
    function handleMessage(event: MessageEvent<IntegrationPreviewMessage>) {
      if (event.origin !== window.location.origin) {
        return;
      }

      if (!isIntegrationPreviewMessage(event.data)) {
        return;
      }

      setAppearanceForm(event.data.appearance);
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return (
    <>
      <EmbedIntegrationChrome
        appearance={appearance.header}
        organizationSlug={organizationSlug}
      />
      <main className="flex-1">
        <EmbedAgendaPreviewRoot
          baseFilters={baseFilters}
          displayConfig={appearance.agenda}
        />
      </main>
    </>
  );
}

type EmbedIntegrationShellProps = {
  organizationSlug: string;
  appearance: ResolvedEmbedAppearance;
  children: React.ReactNode;
};

export function EmbedIntegrationShell({
  organizationSlug,
  appearance,
  children,
}: EmbedIntegrationShellProps) {
  return (
    <>
      <EmbedIntegrationChrome
        appearance={appearance.header}
        organizationSlug={organizationSlug}
      />
      <main className="flex-1">{children}</main>
    </>
  );
}

export function EmbedAgendaSuspenseFallback({
  baseFilters,
  appearance,
}: {
  baseFilters?: AgendaBaseFilters;
  appearance: ResolvedEmbedAppearance;
}) {
  return (
    <AgendaViewSkeleton
      baseFilters={baseFilters}
      displayConfig={appearance.agenda}
    />
  );
}
