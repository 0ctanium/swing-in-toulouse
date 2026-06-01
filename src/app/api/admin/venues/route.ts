import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { venues } from "@/db/schema";
import { assertAdminApi } from "@/lib/admin/auth";
import { invalidatePublicVenueCache } from "@/lib/cache/invalidate";
import { generateVenueSlug } from "@/lib/slug";
import { resolveUniqueVenueSlug } from "@/lib/venues/admin";
import { summarizeDebug, venueMatchingLog } from "@/lib/venues/matching-debug";
import { getVenueMatchingOverview } from "@/lib/venues/matching";
import { venueWriteSchema } from "@/lib/venues/schemas";

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

export async function POST(request: NextRequest) {
  const authError = await assertAdminApi(request);
  if (authError) {
    return authError;
  }

  const parsed = venueWriteSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Corps de requête invalide.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const baseSlug =
    parsed.data.slug?.trim() || generateVenueSlug(parsed.data.name);
  const slug = await resolveUniqueVenueSlug(baseSlug);

  const [created] = await db
    .insert(venues)
    .values({
      name: parsed.data.name.trim(),
      slug,
      address: parsed.data.address?.trim() || null,
      city: parsed.data.city.trim(),
      category: parsed.data.category ?? null,
      locationKind: parsed.data.locationKind ?? "place",
    })
    .returning();

  invalidatePublicVenueCache();

  return NextResponse.json({ venue: created }, { status: 201 });
}
