"use client";

import Link from "next/link";

type VenuesMergeAlertProps = {
  similarGroupCount: number;
  locationConflictCount: number;
};

export function VenuesMergeAlert({
  similarGroupCount,
  locationConflictCount,
}: VenuesMergeAlertProps) {
  if (similarGroupCount === 0 && locationConflictCount === 0) {
    return null;
  }

  const parts: string[] = [];

  if (similarGroupCount > 0) {
    parts.push(
      `${similarGroupCount} groupe${similarGroupCount > 1 ? "s" : ""} de lieux similaires`,
    );
  }

  if (locationConflictCount > 0) {
    parts.push(
      `${locationConflictCount} libellé${locationConflictCount > 1 ? "s" : ""} iCal partagé${locationConflictCount > 1 ? "s" : ""}`,
    );
  }

  return (
    <div className="rounded-lg border border-sky-500/40 bg-sky-500/10 px-4 py-3 text-sm text-sky-950 dark:text-sky-100">
      <p className="font-medium">Fusions de lieux à traiter</p>
      <p className="mt-1 text-sky-900/80 dark:text-sky-100/80">
        {parts.join(" · ")}.
      </p>
      <Link
        href="/admin/venues/merge"
        className="mt-2 inline-block font-medium underline"
      >
        Fusionner les lieux →
      </Link>
    </div>
  );
}
