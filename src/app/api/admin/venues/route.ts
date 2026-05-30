import { NextResponse } from "next/server";

import { assertAdminApi } from "@/lib/admin/auth";
import { summarizeDebug, venueMatchingLog } from "@/lib/venues/matching-debug";
import { getVenueMatchingOverview } from "@/lib/venues/matching";

export async function GET() {
  const authError = await assertAdminApi();
  if (authError) {
    return authError;
  }

  const overview = await getVenueMatchingOverview();
  venueMatchingLog("GET /api/admin/venues", {
    venueCount: overview.venues.length,
    similarGroupCount: overview.similarGroups.length,
  });

  return NextResponse.json(overview);
}
