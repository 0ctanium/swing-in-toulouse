import { NextResponse } from "next/server";

import { icalFeedRedirect } from "@/lib/ical/redirect";
import { emptyIcalPayload } from "@/lib/ical/payload";
import { resolveEventBySlug } from "@/lib/events/queries";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const resolution = await resolveEventBySlug(slug);

  if (!resolution) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const eventSlug =
    resolution.kind === "redirect" ? resolution.targetSlug : resolution.event.slug;

  return icalFeedRedirect(request, {
    ...emptyIcalPayload(),
    event: [eventSlug],
  });
}
