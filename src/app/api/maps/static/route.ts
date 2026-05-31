import { NextRequest, NextResponse } from "next/server";

import { GOOGLE_MAPS_HTTP_CACHE_CONTROL } from "@/lib/cache/google";
import { isGoogleMapsConfigured } from "@/env";
import { getStaticMapImage } from "@/lib/google/cached-media";

const LAT_MIN = -90;
const LAT_MAX = 90;
const LNG_MIN = -180;
const LNG_MAX = 180;

function parseCoordinate(value: string | null, min: number, max: number) {
  if (value == null) {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    return null;
  }

  return parsed;
}

export async function GET(request: NextRequest) {
  if (!isGoogleMapsConfigured()) {
    return new NextResponse(null, { status: 404 });
  }

  const latitude = parseCoordinate(
    request.nextUrl.searchParams.get("lat"),
    LAT_MIN,
    LAT_MAX,
  );
  const longitude = parseCoordinate(
    request.nextUrl.searchParams.get("lng"),
    LNG_MIN,
    LNG_MAX,
  );

  if (latitude == null || longitude == null) {
    return new NextResponse(null, { status: 400 });
  }

  const image = await getStaticMapImage(latitude, longitude);
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
