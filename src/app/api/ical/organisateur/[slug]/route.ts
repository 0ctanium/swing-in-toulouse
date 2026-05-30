import { NextResponse } from "next/server";

import { getEventsForExport } from "@/lib/events/queries";
import { serializeCalendar, toNormalizedEvent } from "@/lib/ical/serializer";
import { siteConfig } from "@/lib/site";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const events = await getEventsForExport({ organizationSlug: slug });

  if (events.length === 0) {
    return NextResponse.json({ error: "No events found" }, { status: 404 });
  }

  const organizerName = events[0]?.organization?.name ?? slug;
  const calendar = serializeCalendar(
    events.map((event) => toNormalizedEvent(event)),
    {
      name: `${organizerName} | ${siteConfig.name}`,
      description: `Événements swing de ${organizerName} à Toulouse`,
      prodId: siteConfig.icalProdId,
    },
  );

  return new NextResponse(calendar, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}.ics"`,
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
