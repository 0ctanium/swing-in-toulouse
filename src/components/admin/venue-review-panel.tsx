"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  venueIssueLabel,
  type VenueQualityIssue,
} from "@/lib/venues/parse-location";

type VenueReviewEntry = {
  id: string;
  slug: string;
  name: string;
  address: string | null;
  city: string;
  eventCount: number;
  issues: VenueQualityIssue[];
};

export function VenueReviewPanel({ venues }: { venues: VenueReviewEntry[] }) {
  if (venues.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Lieux à vérifier</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-muted-foreground text-sm">
          Lieux dont le nom et l&apos;adresse sont redondants, ou dont le nom
          ressemble à une adresse complète (souvent un iCal <code>LOCATION</code>{" "}
          sans virgule). Corrigez directement ici — pas besoin d&apos;override :
          la sync iCal ne réécrit pas les lieux existants.
        </p>
        <ul className="flex flex-col gap-3">
          {venues.map((venue) => (
            <VenueReviewRow key={venue.id} venue={venue} />
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function VenueReviewRow({ venue }: { venue: VenueReviewEntry }) {
  const router = useRouter();
  const [name, setName] = useState(venue.name);
  const [address, setAddress] = useState(venue.address ?? "");
  const [city, setCity] = useState(venue.city);
  const [pending, setPending] = useState(false);

  async function save() {
    setPending(true);

    try {
      const response = await fetch(`/api/admin/venues/${venue.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          address: address.trim() || null,
          city: city.trim(),
        }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(data.error ?? "Enregistrement impossible.");
      }

      toast.success("Lieu mis à jour.");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Enregistrement impossible.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <li className="flex flex-col gap-3 rounded-lg border p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <p className="font-medium">{venue.name}</p>
          <p className="text-muted-foreground text-xs">
            {venue.eventCount} événement{venue.eventCount > 1 ? "s" : ""} ·{" "}
            <Link href={`/lieu/${venue.slug}`} className="hover:underline">
              /lieu/{venue.slug}
            </Link>
          </p>
        </div>
        <ul className="flex flex-wrap gap-1">
          {venue.issues.map((issue) => (
            <li
              key={issue}
              className="rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[11px] text-amber-950 dark:text-amber-100"
            >
              {venueIssueLabel(issue)}
            </li>
          ))}
        </ul>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Nom</span>
          <input
            className="rounded-lg border bg-background px-3 py-2"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Ville</span>
          <input
            className="rounded-lg border bg-background px-3 py-2"
            value={city}
            onChange={(event) => setCity(event.target.value)}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span className="font-medium">Adresse</span>
          <input
            className="rounded-lg border bg-background px-3 py-2"
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            placeholder="Rue, code postal…"
          />
        </label>
      </div>

      <Button type="button" size="sm" disabled={pending} onClick={save}>
        {pending ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </li>
  );
}
