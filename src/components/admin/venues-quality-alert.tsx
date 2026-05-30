import Link from "next/link";

import { adminVenuesPendingFilterHref } from "@/lib/venues/admin-venues-params";

type VenuesQualityAlertProps = {
  count: number;
  linkToConfirm?: boolean;
};

export function VenuesQualityAlert({
  count,
  linkToConfirm = false,
}: VenuesQualityAlertProps) {
  if (count === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100">
      <p className="font-medium">
        {count} lieu{count > 1 ? "x" : ""} actif{count > 1 ? "s" : ""}{" "}
        {count > 1 ? "ont" : "a"} un nom iCal douteux
      </p>
      <p className="mt-1 text-amber-900/80 dark:text-amber-100/80">
        Corrigez le nom lors de la confirmation ou de la modification Google.
      </p>
      {linkToConfirm ? (
        <Link
          href={adminVenuesPendingFilterHref()}
          className="mt-2 inline-block font-medium underline"
        >
          Afficher les lieux à confirmer →
        </Link>
      ) : null}
    </div>
  );
}
