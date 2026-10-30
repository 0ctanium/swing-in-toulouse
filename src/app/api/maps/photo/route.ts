import { connection, NextRequest, NextResponse } from "next/server";

import { GOOGLE_MAPS_HTTP_CACHE_CONTROL } from "@/lib/cache/google";
import { invalidateGooglePlaceCache } from "@/lib/cache/invalidate";
import { isGoogleMapsConfigured } from "@/env";
import { getPlacePhotoImage } from "@/lib/google/cached-media";

const PHOTO_NAME_PATTERN = /^places\/[^/]+\/photos\/[^/]+$/;

export async function GET(request: NextRequest) {
  // Reads the URL: rendered per request, never prerendered (Cache Components).
  await connection();
  if (!isGoogleMapsConfigured()) {
    return new NextResponse(null, { status: 404 });
  }

  const name = request.nextUrl.searchParams.get("name")?.trim();
  if (!name || !PHOTO_NAME_PATTERN.test(name)) {
    return new NextResponse(null, { status: 400 });
  }

  const image = await getPlacePhotoImage(name);
  if (!image) {
    // Photo names expire while the place stays cached for 30 days (Google: "retrieve it from
    // Places API endpoints"): forget the place, so the next render fetches fresh names.
    await invalidateGooglePlaceCache(name.split("/")[1]!);
    return new NextResponse(null, { status: 502 });
  }

  return new NextResponse(image.bytes, {
    status: 200,
    headers: {
      "Content-Type": image.contentType,
      "Cache-Control": GOOGLE_MAPS_HTTP_CACHE_CONTROL,
    },
  });
}
