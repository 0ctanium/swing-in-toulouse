import type { Metadata } from "next";

import { VenuesAdmin } from "@/components/admin/venues-admin";
import { VenuesAdminAlerts } from "@/components/admin/venues-admin-alerts";
import { VenuesGoogleMapsAlert } from "@/components/admin/venues-google-maps-alert";
import { isGoogleMapsConfigured } from "@/env";
import { adminMetadata } from "@/lib/metadata";
import { getAdminVenuesPageData } from "@/lib/venues/matching";

export const metadata: Metadata = adminMetadata({
  title: "Lieux",
  description:
    "Liste des lieux, confirmation Google, alias permanents et réassignation.",
});

export const dynamic = "force-dynamic";

export default async function AdminVenuesPage() {
  const googleConfigured = isGoogleMapsConfigured();
  const {
    venues,
    allVenues,
    venueRedirects,
    similarGroupCount,
    locationConflictCount,
    pendingConfirmationCount,
    activeQualityIssueCount,
  } = await getAdminVenuesPageData();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-semibold">Lieux</h1>
        <p className="text-muted-foreground max-w-2xl">
          Gérez les lieux principaux, confirmez les adresses via Google depuis
          le tableau, et réassignez les événements si besoin. Les fusions se
          font sur une page dédiée.
        </p>
      </div>

      <VenuesAdminAlerts
        pendingConfirmationCount={pendingConfirmationCount}
        activeQualityIssueCount={activeQualityIssueCount}
        similarGroupCount={similarGroupCount}
        locationConflictCount={locationConflictCount}
      />

      <VenuesGoogleMapsAlert configured={googleConfigured} />

      <VenuesAdmin
        venues={venues}
        allVenues={allVenues}
        venueRedirects={venueRedirects}
        pendingConfirmationCount={pendingConfirmationCount}
        googleConfigured={googleConfigured}
      />
    </div>
  );
}
