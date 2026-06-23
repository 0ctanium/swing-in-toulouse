import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { assertPlatformAdminApi } from "@/lib/admin/auth";
import { isGoogleMapsConfigured } from "@/env";
import {
  geocodeAddress,
  getPlaceDetails,
  GooglePlacesError,
} from "@/lib/google/places";

const querySchema = z.object({
  placeId: z.string().min(1).optional(),
  query: z.string().min(3).optional(),
});

export async function GET(request: NextRequest) {
  const authError = await assertPlatformAdminApi();
  if (authError) {
    return authError;
  }

  if (!isGoogleMapsConfigured()) {
    return NextResponse.json(
      { error: "Google Maps API non configurée (GOOGLE_MAPS_API_KEY)." },
      { status: 503 },
    );
  }

  const parsed = querySchema.safeParse({
    placeId: request.nextUrl.searchParams.get("placeId") ?? undefined,
    query: request.nextUrl.searchParams.get("query") ?? undefined,
  });

  if (!parsed.success || (!parsed.data.placeId && !parsed.data.query)) {
    return NextResponse.json(
      { error: "Paramètre placeId ou query requis." },
      { status: 400 },
    );
  }

  try {
    const place = parsed.data.placeId
      ? await getPlaceDetails(parsed.data.placeId)
      : await geocodeAddress(parsed.data.query!);

    return NextResponse.json({ place });
  } catch (error) {
    if (error instanceof GooglePlacesError) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }

    throw error;
  }
}
