import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { assertPlatformAdminApi } from "@/lib/admin/auth";
import {
  autocompletePlaces,
  GooglePlacesError,
} from "@/lib/google/places";
import { isGoogleMapsConfigured } from "@/env";

const querySchema = z.object({
  input: z.string().min(3),
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
    input: request.nextUrl.searchParams.get("input") ?? "",
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Saisissez au moins 3 caractères." },
      { status: 400 },
    );
  }

  try {
    const suggestions = await autocompletePlaces(parsed.data.input);
    return NextResponse.json({ suggestions });
  } catch (error) {
    if (error instanceof GooglePlacesError) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }

    throw error;
  }
}
