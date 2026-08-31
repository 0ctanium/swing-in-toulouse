import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { AgendaPrefetchBoundary } from "@/components/events/agenda-prefetch-boundary";
import { AgendaViewSkeleton } from "@/components/events/agenda-view";
import {
  EmbedAgendaSuspenseFallback,
  EmbedIntegrationShell,
  EmbedPreviewShell,
} from "@/components/integrations/embed-integration-shell";
import { buildEmbedAgendaBaseFilters } from "@/lib/integrations/base-filters";
import { getEmbeddedIntegrationById } from "@/lib/integrations/embed-page";
import { parseAppearanceParam } from "@/lib/integrations/embed-preview";
import {
  buildEmbedPreviewState,
  buildIntegrationThemeDefaults,
  resolveEmbedAppearanceFromTheme,
} from "@/lib/integrations/theme";
import { embedAgendaUrl, siteConfig } from "@/lib/site";

type EmbedIntegrationPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    preview?: string;
    appearance?: string;
    /** @deprecated Use appearance */
    display?: string;
  }>;
};

export async function generateMetadata({
  params,
  searchParams,
}: EmbedIntegrationPageProps): Promise<Metadata> {
  const { id } = await params;
  const { preview, appearance: appearanceParam, display } = await searchParams;
  const result = await getEmbeddedIntegrationById(id);

  if (!result) {
    return {
      title: "Agenda",
      robots: { index: false, follow: false },
    };
  }

  const defaults = buildIntegrationThemeDefaults({
    integrationName: result.integration.name,
    organizationName: result.organization.name,
  });

  const isPreview = preview === "1";
  const appearanceOverride = parseAppearanceParam(appearanceParam ?? display);
  const resolved = isPreview
    ? buildEmbedPreviewState({
        integrationName: result.integration.name,
        organizationName: result.organization.name,
        theme: result.integration.theme,
        appearanceOverride,
      }).appearance
    : resolveEmbedAppearanceFromTheme(result.integration.theme, defaults);

  return {
    title: resolved.metadata.title,
    ...(resolved.metadata.description
      ? { description: resolved.metadata.description }
      : {}),
    robots: { index: false, follow: false },
    alternates: {
      canonical: embedAgendaUrl(id),
    },
  };
}

function EmbedIntegrationPageSkeleton() {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col gap-4 px-3 py-4 sm:px-4 sm:py-6">
      <AgendaViewSkeleton />
      <footer className="pb-2 text-center text-xs text-muted-foreground">
        Propulsé par{" "}
        <Link
          href={siteConfig.url}
          target="_blank"
          rel="noreferrer"
          className="underline-offset-4 hover:text-foreground hover:underline"
        >
          {siteConfig.name}
        </Link>
      </footer>
    </div>
  );
}

async function EmbedIntegrationPageContent({
  params,
  searchParams,
}: EmbedIntegrationPageProps) {
  const { id } = await params;
  const { preview, appearance: appearanceParam, display } = await searchParams;
  const result = await getEmbeddedIntegrationById(id);

  if (!result) {
    notFound();
  }

  const { organization, integration: integrationRow } = result;
  const baseFilters = buildEmbedAgendaBaseFilters({
    organizationSlug: organization.slug,
    integrationBaseFilters: integrationRow.baseFilters,
  });
  const isPreview = preview === "1";
  const previewState = buildEmbedPreviewState({
    integrationName: integrationRow.name,
    organizationName: organization.name,
    theme: integrationRow.theme,
    appearanceOverride: parseAppearanceParam(appearanceParam ?? display),
  });
  const resolvedAppearance = isPreview
    ? previewState.appearance
    : resolveEmbedAppearanceFromTheme(
        integrationRow.theme,
        previewState.defaults,
      );

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col gap-4 px-3 py-4 sm:px-4 sm:py-6">
      {isPreview ? (
        <EmbedPreviewShell
          organizationSlug={organization.slug}
          baseFilters={baseFilters}
          initialAppearanceForm={previewState.appearanceForm}
        />
      ) : (
        <EmbedIntegrationShell
          organizationSlug={organization.slug}
          appearance={resolvedAppearance}
        >
          <Suspense
            fallback={
              <EmbedAgendaSuspenseFallback
                baseFilters={baseFilters}
                appearance={resolvedAppearance}
              />
            }
          >
            <AgendaPrefetchBoundary
              baseFilters={baseFilters}
              displayConfig={resolvedAppearance.agenda}
              persistPreferences={false}
            />
          </Suspense>
        </EmbedIntegrationShell>
      )}

      <footer className="pb-2 text-center text-xs text-muted-foreground">
        Propulsé par{" "}
        <Link
          href={siteConfig.url}
          target="_blank"
          rel="noreferrer"
          className="underline-offset-4 hover:text-foreground hover:underline"
        >
          {siteConfig.name}
        </Link>
      </footer>
    </div>
  );
}

export default function EmbedIntegrationPage(props: EmbedIntegrationPageProps) {
  return (
    <Suspense fallback={<EmbedIntegrationPageSkeleton />}>
      <EmbedIntegrationPageContent {...props} />
    </Suspense>
  );
}
