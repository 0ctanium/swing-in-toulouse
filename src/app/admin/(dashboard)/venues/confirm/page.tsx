import Link from "next/link";

import { VenueConfirmPanel } from "@/components/admin/venue-confirm-panel";
import { getVenueConfirmationOverview } from "@/lib/venues/matching";
import { isGoogleMapsConfigured } from "@/env";

export const dynamic = "force-dynamic";

export default async function AdminVenuesConfirmPage() {
  const data = await getVenueConfirmationOverview();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link
          href="/admin/venues"
          className="text-muted-foreground text-sm hover:underline"
        >
          ← Retour aux lieux
        </Link>
        <h1 className="font-heading text-3xl font-semibold">
          Confirmer les adresses
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          Validez chaque lieu actif avec Google Places pour obtenir une adresse
          formatée et des coordonnées GPS. Les corrections sont enregistrées
          directement sur le lieu (non écrasées par la sync iCal).
        </p>
      </div>

      <VenueConfirmPanel
        pending={data.pending}
        confirmed={data.confirmed}
        inactive={data.inactive}
        activeQualityIssueCount={data.activeQualityIssueCount}
        googleConfigured={isGoogleMapsConfigured()}
      />
    </div>
  );
}
