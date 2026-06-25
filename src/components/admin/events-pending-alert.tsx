"use client";

import Link from "next/link";
import { use } from "react";

type EventsPendingAlertProps = {
  pendingCount: Promise<number>;
};

export function EventsPendingAlert({
  pendingCount: pendingCountPromise,
}: EventsPendingAlertProps) {
  const pendingCount = use(pendingCountPromise);
  if (pendingCount === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100">
      <p className="font-medium">
        {pendingCount} événement{pendingCount > 1 ? "s" : ""} à confirmer
      </p>
      <p className="mt-1 text-amber-900/80 dark:text-amber-100/80">
        Des événements synchronisés depuis iCal n&apos;ont pas encore été
        validés (métadonnées, lieu, organisateur, catégories).
      </p>
      <Link
        href="/admin/events/confirm"
        className="mt-2 inline-block font-medium underline"
      >
        Ouvrir la file de confirmation →
      </Link>
    </div>
  );
}
