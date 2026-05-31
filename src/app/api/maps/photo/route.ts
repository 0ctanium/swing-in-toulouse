import { NextRequest, NextResponse } from "next/server";

import { GOOGLE_MAPS_HTTP_CACHE_CONTROL } from "@/lib/cache/google";
import { isGoogleMapsConfigured } from "@/env";
import { getPlacePhotoImage } from "@/lib/google/cached-media";

const PHOTO_NAME_PATTERN = /^places\/[^/]+\/photos\/[^/]+$/;

export async function GET(request: NextRequest) {
  if (!isGoogleMapsConfigured()) {
    return new NextResponse(null, { status: 404 });
  }

  const name = request.nextUrl.searchParams.get("name")?.trim();
  if (!name || !PHOTO_NAME_PATTERN.test(name)) {
    return new NextResponse(null, { status: 400 });
  }

  const image = await getPlacePhotoImage(name);
  if (!image) {
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
