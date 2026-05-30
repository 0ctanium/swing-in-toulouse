import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { venues } from "@/db/schema";
import { assertAdminApi } from "@/lib/admin/auth";
import { isGoogleMapsConfigured } from "@/env";
import {
  geocodeAddress,
  getPlaceDetails,
  GooglePlacesError,
} from "@/lib/google/places";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const bodySchema = z.object({
  placeId: z.string().min(1).optional(),
  query: z.string().min(3).optional(),
  name: z.string().trim().min(1),
});

export async function POST(request: NextRequest, context: RouteContext) {
  const authError = await assertAdminApi(request);
  if (authError) {
    return authError;
  }

  if (!isGoogleMapsConfigured()) {
    return NextResponse.json(
      { error: "Google Maps API non configurée (GOOGLE_MAPS_API_KEY)." },
      { status: 503 },
    );
  }

  const { id } = await context.params;
  const parsed = bodySchema.safeParse(await request.json());

  if (!parsed.success || (!parsed.data.placeId && !parsed.data.query)) {
    return NextResponse.json(
      { error: "placeId ou query requis." },
      { status: 400 },
    );
  }

  const existing = await db.query.venues.findFirst({
    where: eq(venues.id, id),
  });

  if (!existing) {
    return NextResponse.json({ error: "Lieu introuvable." }, { status: 404 });
  }

  try {
    const place = parsed.data.placeId
      ? await getPlaceDetails(parsed.data.placeId)
      : await geocodeAddress(parsed.data.query!);

    const [updated] = await db
      .update(venues)
      .set({
        name: parsed.data.name,
        address: place.address,
        city: place.city,
        latitude: place.latitude,
        longitude: place.longitude,
        googlePlaceId: place.placeId,
        formattedAddress: place.formattedAddress,
        addressConfirmedAt: new Date(),
      })
      .where(eq(venues.id, id))
      .returning();

    return NextResponse.json({ venue: updated, place });
  } catch (error) {
    if (error instanceof GooglePlacesError) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }

    throw error;
  }
}
