import { NextResponse } from "next/server";

import { getEventsForExport } from "@/lib/events/queries";
import { serializeCalendar, toNormalizedEvent } from "@/lib/ical/serializer";
import { siteConfig } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function GET() {
  const events = await getEventsForExport();

  const calendar = serializeCalendar(
    events.map((event) => toNormalizedEvent(event)),
    {
      name: siteConfig.name,
      description: siteConfig.description,
      prodId: siteConfig.icalProdId,
    },
  );

  return new NextResponse(calendar, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="swing-toulouse.ics"',
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
