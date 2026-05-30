"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { VenueRedirectEntry } from "@/lib/venues/canonical";

type VenueRedirectsPanelProps = {
  redirects: VenueRedirectEntry[];
};

export function VenueRedirectsPanel({ redirects }: VenueRedirectsPanelProps) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);

  if (redirects.length === 0) {
    return null;
  }

  async function removeRedirect(aliasId: string) {
    setPendingId(aliasId);

    try {
      const response = await fetch(`/api/admin/venues/${aliasId}/alias`, {
        method: "DELETE",
      });
      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Suppression impossible.");
      }

      toast.success("Alias permanent supprimé.");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Suppression impossible.",
      );
    } finally {
      setPendingId(null);
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
                disabled={pendingId === redirect.aliasId}
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
