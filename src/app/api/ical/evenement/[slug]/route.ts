import { NextResponse } from "next/server";
import { redirect } from "next/navigation";

import { resolveEventBySlug } from "@/lib/events/queries";
import { serializeCalendar, toNormalizedEvent } from "@/lib/ical/serializer";
import { siteConfig } from "@/lib/site";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const resolution = await resolveEventBySlug(slug);

  if (!resolution) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  if (resolution.kind === "redirect") {
    redirect(`/evenement/${resolution.targetSlug}.ics`);
  }

  const event = resolution.event;

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
