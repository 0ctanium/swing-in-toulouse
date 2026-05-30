import type { Metadata } from "next";
import Link from "next/link";

import { VenueMergeTool } from "@/components/admin/venue-merge-tool";
import { adminMetadata } from "@/lib/metadata";
import { getVenueMergePageData } from "@/lib/venues/matching";

export const metadata: Metadata = adminMetadata({
  title: "Fusionner les lieux",
  description:
    "Fusion des doublons et correction des LOCATION iCal incohérentes.",
});

export const dynamic = "force-dynamic";

export default async function AdminVenuesMergePage() {
  const { venues, similarGroups, locationConflicts } =
    await getVenueMergePageData();

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
          Fusionner les lieux
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          Regroupez les lieux similaires ou corrigez les libellés LOCATION iCal
          qui pointent vers plusieurs lieux. Pour une fusion libre, utilisez la
          réassignation manuelle depuis la liste des lieux.
        </p>
      </div>

      <VenueMergeTool
        venues={venues}
        similarGroups={similarGroups}
        locationConflicts={locationConflicts}
      />
    </div>
  );
}
