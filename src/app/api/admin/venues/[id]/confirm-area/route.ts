import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { venues } from "@/db/schema";
import { assertAdminApi } from "@/lib/admin/auth";
import {
  invalidateGoogleCachesForVenue,
  invalidatePublicVenueCache,
} from "@/lib/cache/invalidate";
import { venueCategoryValues } from "@/lib/venues/categories";
import {
  googleFieldsForLocationKind,
  venueLocationKindValues,
} from "@/lib/venues/location-kind";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const bodySchema = z.object({
  name: z.string().trim().min(1),
  city: z.string().trim().min(1),
  address: z.string().trim().nullable().optional(),
  category: z.enum(venueCategoryValues).nullable().optional(),
  locationKind: z.enum(venueLocationKindValues).refine(
    (kind) => kind === "area" || kind === "none",
    "Seuls les types zone ou sans adresse sont acceptés.",
  ),
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
  });

  if (!existing) {
    return NextResponse.json({ error: "Lieu introuvable." }, { status: 404 });
  }

  const [updated] = await db
    .update(venues)
    .set({
      name: parsed.data.name,
      city: parsed.data.city,
      address: parsed.data.address?.trim() || null,
      locationKind: parsed.data.locationKind,
      ...(parsed.data.category !== undefined
        ? { category: parsed.data.category }
        : {}),
      ...googleFieldsForLocationKind(parsed.data.locationKind),
    })
    .where(eq(venues.id, id))
    .returning();

  invalidateGoogleCachesForVenue(existing);
  invalidatePublicVenueCache(updated);

  return NextResponse.json({ venue: updated });
}
