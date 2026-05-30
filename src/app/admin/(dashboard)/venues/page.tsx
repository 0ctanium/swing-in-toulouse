import Link from "next/link";

import { VenuesAdminAlerts } from "@/components/admin/venues-admin-alerts";
import { VenueMatchingTool } from "@/components/admin/venue-matching-tool";
import { getVenueMatchingOverview } from "@/lib/venues/matching";

export const dynamic = "force-dynamic";

export default async function AdminVenuesPage() {
  const {
    venues,
    similarGroups,
    locationConflicts,
    pendingConfirmationCount,
    activeQualityIssueCount,
  } = await getVenueMatchingOverview();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link href="/admin" className="text-muted-foreground text-sm hover:underline">
          ← Retour aux corrections
        </Link>
        <h1 className="font-heading text-3xl font-semibold">Lieux</h1>
        <p className="text-muted-foreground max-w-2xl">
          Fusionnez des lieux similaires et réassignez les événements. La
          confirmation d&apos;adresse Google se fait sur une page dédiée.
        </p>
        <p className="text-sm">
          <Link href="/admin/venues/confirm" className="font-medium underline">
            Confirmer les adresses
          </Link>
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
      />
    </div>
  );
}
