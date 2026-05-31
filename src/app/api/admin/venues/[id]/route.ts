import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { venues } from "@/db/schema";
import { assertAdminApi } from "@/lib/admin/auth";
import { invalidatePublicVenueCache } from "@/lib/cache/invalidate";
import { venueCategoryValues } from "@/lib/venues/categories";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const venueCategorySchema = z.enum(venueCategoryValues).nullable();

const bodySchema = z.object({
  name: z.string().min(1).optional(),
  address: z.string().nullable().optional(),
  city: z.string().min(1).optional(),
  category: venueCategorySchema.optional(),
});

export async function PUT(request: NextRequest, context: RouteContext) {
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

  const clearsConfirmation =
    (parsed.data.name !== undefined &&
      parsed.data.name.trim() !== existing.name) ||
    (parsed.data.address !== undefined &&
      (parsed.data.address?.trim() || null) !== existing.address) ||
    (parsed.data.city !== undefined && parsed.data.city.trim() !== existing.city);

  const [updated] = await db
    .update(venues)
    .set({
      ...(parsed.data.name !== undefined ? { name: parsed.data.name.trim() } : {}),
      ...(parsed.data.address !== undefined
        ? { address: parsed.data.address?.trim() || null }
        : {}),
      ...(parsed.data.city !== undefined ? { city: parsed.data.city.trim() } : {}),
      ...(parsed.data.category !== undefined
        ? { category: parsed.data.category }
        : {}),
      ...(clearsConfirmation
        ? {
            latitude: null,
            longitude: null,
            googlePlaceId: null,
            formattedAddress: null,
            addressConfirmedAt: null,
          }
        : {}),
    })
    .where(eq(venues.id, id))
    .returning();

  invalidatePublicVenueCache();

  return NextResponse.json({ venue: updated });
}
