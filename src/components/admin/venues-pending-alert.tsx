"use client";

import Link from "next/link";

import { adminVenuesPendingFilterHref } from "@/lib/venues/admin-venues-params";

type VenuesPendingAlertProps = {
  pendingCount: number;
};

export function VenuesPendingAlert({ pendingCount }: VenuesPendingAlertProps) {
  if (pendingCount === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100">
      <p className="font-medium">
        {pendingCount} lieu{pendingCount > 1 ? "x" : ""} à confirmer
      </p>
      <p className="mt-1 text-amber-900/80 dark:text-amber-100/80">
        Des lieux actifs n&apos;ont pas encore d&apos;adresse validée via Google
        (coordonnées GPS manquantes).
      </p>
      <Link
        href={adminVenuesPendingFilterHref()}
        className="mt-2 inline-block font-medium underline"
      >
        Afficher les lieux à confirmer →
      </Link>
    </div>
  );
}
