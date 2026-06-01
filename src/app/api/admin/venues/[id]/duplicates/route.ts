import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { venues } from "@/db/schema";
import { assertAdminApi } from "@/lib/admin/auth";
import {
  findVenueDuplicateCandidates,
  type VenueComparable,
} from "@/lib/venues/duplicate-candidates";
import { computeEffectiveVenueEventCounts } from "@/lib/venues/effective-venue";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const bodySchema = z.object({
  name: z.string().trim().min(1),
  address: z.string().trim().nullable().optional(),
  city: z.string().trim().optional(),
  formattedAddress: z.string().trim().nullable().optional(),
  googlePlaceId: z.string().trim().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  requireAddressSignal: z.boolean().optional(),
  minConfidence: z.enum(["certain", "likely", "possible"]).optional(),
});

export async function POST(request: NextRequest, context: RouteContext) {
  const authError = await assertAdminApi(request);
  if (authError) {
    return authError;
  }

  const { id } = await context.params;
  const parsed = bodySchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Corps de requête invalide.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const existing = await db.query.venues.findFirst({
    where: eq(venues.id, id),
    columns: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Lieu introuvable." }, { status: 404 });
  }

  const [venueRows, effectiveCounts] = await Promise.all([
    db.query.venues.findMany({
      columns: {
        id: true,
        slug: true,
        name: true,
        address: true,
        city: true,
        latitude: true,
        longitude: true,
        googlePlaceId: true,
        formattedAddress: true,
        addressConfirmedAt: true,
        canonicalVenueId: true,
        locationKind: true,
      },
    }),
    computeEffectiveVenueEventCounts(),
  ]);

  const comparable: VenueComparable[] = venueRows.map((venue) => ({
    ...venue,
    eventCount: effectiveCounts.get(venue.id) ?? 0,
  }));

  const candidates = findVenueDuplicateCandidates(comparable, {
    excludeVenueId: id,
    ...parsed.data,
  });

  return NextResponse.json({ candidates });
}
