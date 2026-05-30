"use client";

import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRemoveVenueAlias } from "@/lib/admin/use-venues";
import type { VenueRedirectEntry } from "@/lib/venues/canonical";

type VenueRedirectsPanelProps = {
  redirects: VenueRedirectEntry[];
};

export function VenueRedirectsPanel({ redirects }: VenueRedirectsPanelProps) {
  const removeAlias = useRemoveVenueAlias();

  if (redirects.length === 0) {
    return null;
  }

  async function removeRedirect(aliasId: string) {
    try {
      await removeAlias.mutateAsync(aliasId);
      toast.success("Alias permanent supprimé.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Suppression impossible.",
      );
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          Alias permanents ({redirects.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-1 text-sm">
          {redirects.map((redirect) => (
            <li
              key={redirect.aliasId}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md px-1 py-1.5"
            >
              <div className="flex min-w-0 flex-col gap-0.5">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm">
                  <Link
                    href={`/lieu/${redirect.aliasSlug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium hover:underline"
                  >
                    /lieu/{redirect.aliasSlug}
                  </Link>
                  <span className="text-muted-foreground">→</span>
                  <Link
                    href={`/lieu/${redirect.canonicalSlug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium hover:underline"
                  >
                    /lieu/{redirect.canonicalSlug}
                  </Link>
                </div>
                <span className="text-muted-foreground text-xs">
                  {redirect.aliasName} → {redirect.canonicalName}
                  {redirect.eventCount > 0
                    ? ` · ${redirect.eventCount} événement${redirect.eventCount > 1 ? "s" : ""}`
                    : ""}
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                disabled={
                  removeAlias.isPending &&
                  removeAlias.variables === redirect.aliasId
                }
                onClick={() => removeRedirect(redirect.aliasId)}
              >
                Supprimer
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
