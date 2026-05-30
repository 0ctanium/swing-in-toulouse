import Link from "next/link";

import { VenueMatchingTool } from "@/components/admin/venue-matching-tool";
import { VenueReviewPanel } from "@/components/admin/venue-review-panel";
import { getVenueMatchingOverview } from "@/lib/venues/matching";

export const dynamic = "force-dynamic";

export default async function AdminVenuesPage() {
  const { venues, similarGroups, locationConflicts, venuesNeedingReview } =
    await getVenueMatchingOverview();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Link href="/admin" className="text-muted-foreground text-sm hover:underline">
          ← Retour aux corrections
        </Link>
        <h1 className="font-heading text-3xl font-semibold">Lieux</h1>
        <p className="text-muted-foreground max-w-2xl">
          Corrigez en masse le rattachement des événements aux lieux. Les
          modifications sont des overrides admin et survivent à la synchronisation
          iCal.
        </p>
      </div>

      <VenueReviewPanel venues={venuesNeedingReview} />

      <VenueMatchingTool
        venues={venues}
        similarGroups={similarGroups}
        locationConflicts={locationConflicts}
      />
    </div>
  );
}
