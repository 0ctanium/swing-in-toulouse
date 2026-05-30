import { buildIcalFeedResponse } from "@/lib/ical/feed";
import { decodeIcalPayload, IcalPayloadError } from "@/lib/ical/payload";
import { getPostHogClient } from "@/lib/posthog-server";
import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ payload: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { payload } = await context.params;

  try {
    const decoded = decodeIcalPayload(payload);
    const posthog = getPostHogClient();
    posthog.capture({
      distinctId: "anonymous",
      event: "calendar_feed_downloaded",
      properties: {
        payload,
        has_org_filter: (decoded.org?.length ?? 0) > 0,
        has_event_filter: (decoded.event?.length ?? 0) > 0,
      },
    });
    return await buildIcalFeedResponse(decoded);
  } catch (error) {
    if (error instanceof IcalPayloadError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    throw error;
  }
}
