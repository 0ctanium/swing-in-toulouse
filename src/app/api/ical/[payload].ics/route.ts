import { buildIcalFeedResponse } from "@/lib/ical/feed";
import { decodeIcalPayload, IcalPayloadError } from "@/lib/ical/payload";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ payload: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { payload } = await context.params;

  try {
    return await buildIcalFeedResponse(decodeIcalPayload(payload));
  } catch (error) {
    if (error instanceof IcalPayloadError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    throw error;
  }
}
