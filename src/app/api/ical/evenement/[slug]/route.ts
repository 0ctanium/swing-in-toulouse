import { NextResponse } from "next/server";

import { getEventBySlug } from "@/lib/events/queries";
import { serializeCalendar, toNormalizedEvent } from "@/lib/ical/serializer";
import { siteConfig } from "@/lib/site";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const event = await getEventBySlug(slug);

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const calendar = serializeCalendar([toNormalizedEvent(event)], {
    name: event.title,
    description: event.description ?? undefined,
    prodId: siteConfig.icalProdId,
  });

  return new NextResponse(calendar, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}.ics"`,
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
