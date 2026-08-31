import Link from "next/link";

import type { ResolvedEmbedAppearance } from "@/lib/integrations/theme";
import { organizerUrl } from "@/lib/site";

type EmbedIntegrationChromeProps = {
  appearance: ResolvedEmbedAppearance["header"];
  organizationSlug: string;
};

export function EmbedIntegrationChrome({
  appearance,
  organizationSlug,
}: EmbedIntegrationChromeProps) {
  if (!appearance.display) {
    return null;
  }

  const hasTitle = appearance.mainTitle || appearance.secondaryTitle;

  return (
    <header className="flex flex-wrap items-start justify-between gap-3 rounded-xl border bg-card px-4 py-3">
      {hasTitle ? (
        <div className="min-w-0">
          {appearance.secondaryTitle ? (
            <p className="text-muted-foreground text-xs uppercase tracking-wide">
              {appearance.secondaryTitle}
            </p>
          ) : null}
          {appearance.mainTitle ? (
            <h1 className="font-heading text-xl font-semibold tracking-tight">
              {appearance.mainTitle}
            </h1>
          ) : null}
        </div>
      ) : (
        <div />
      )}
      {appearance.displayOrganizerLink ? (
        <Link
          href={organizerUrl(organizationSlug)}
          target="_blank"
          rel="noreferrer"
          className="text-muted-foreground text-sm underline-offset-4 hover:text-foreground hover:underline"
        >
          Voir la fiche complète
        </Link>
      ) : null}
    </header>
  );
}
