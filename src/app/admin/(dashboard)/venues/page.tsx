import type { Metadata } from "next";

import { VenuesAdminAlerts } from "@/components/admin/venues-admin-alerts";
import { VenueMatchingTool } from "@/components/admin/venue-matching-tool";
import { adminMetadata } from "@/lib/metadata";
import { getVenueMatchingOverview } from "@/lib/venues/matching";

export const metadata: Metadata = adminMetadata({
  title: "Lieux",
  description:
    "Fusion des doublons, conflits d’adresse et qualité des lieux d’événements.",
});

export const dynamic = "force-dynamic";

export default async function AdminVenuesPage() {
  const {
    venues,
    similarGroups,
    locationConflicts,
    venueRedirects,
    pendingConfirmationCount,
    activeQualityIssueCount,
  } = await getVenueMatchingOverview();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-semibold">Lieux</h1>
        <p className="text-muted-foreground max-w-2xl">
          Fusionnez des lieux similaires et réassignez les événements. La
          confirmation d&apos;adresse Google se fait sur une page dédiée.
        </p>
      </div>

      <VenuesAdminAlerts
        pendingConfirmationCount={pendingConfirmationCount}
        activeQualityIssueCount={activeQualityIssueCount}
      />

      <VenueMatchingTool
        venues={venues}
        similarGroups={similarGroups}
        locationConflicts={locationConflicts}
        venueRedirects={venueRedirects}
      />
    </div>
  );
}
