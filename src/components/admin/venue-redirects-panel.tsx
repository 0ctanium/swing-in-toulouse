"use client";

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
              <span>
                <span className="font-medium">{redirect.aliasName}</span>
                <span className="text-muted-foreground">
                  {" "}
                  → {redirect.canonicalName}
                </span>
              </span>
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
