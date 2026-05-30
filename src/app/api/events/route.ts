import { endOfDay, startOfDay } from "date-fns";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { buildAdminMetaForOccurrences, type AdminEventMeta } from "@/lib/events/admin-meta";
import { getUpcomingEvents } from "@/lib/events/queries";
import { loadOverridesForEvents } from "@/lib/events/overrides";
import { serializeOccurrence } from "@/lib/events/serialize";
import { isAdminAuthenticated } from "@/lib/admin/auth";

const querySchema = z.object({
  from: z.coerce.date(),
  to: z.coerce.date(),
});

export async function GET(request: NextRequest) {
  const parsed = querySchema.safeParse({
    from: request.nextUrl.searchParams.get("from"),
    to: request.nextUrl.searchParams.get("to"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Paramètres from et to requis (ISO 8601)." },
      { status: 400 },
    );
  }

  const { from, to } = parsed.data;

  if (from > to) {
    return NextResponse.json(
      { error: "from doit être antérieur à to." },
      { status: 400 },
    );
  }

  const events = await getUpcomingEvents({
    from: startOfDay(from),
    to: endOfDay(to),
  });

  const isAdmin = await isAdminAuthenticated();
  let adminMetaByOccurrenceId: Map<string, AdminEventMeta> | null = null;

  if (isAdmin && events.length > 0) {
    const masterIds = [...new Set(events.map((event) => event.masterEventId))];
    const overrides = await loadOverridesForEvents(masterIds);
    adminMetaByOccurrenceId = buildAdminMetaForOccurrences(events, overrides);
  }

  return NextResponse.json({
    events: events.map((event) => ({
      ...serializeOccurrence(event),
      ...(adminMetaByOccurrenceId
        ? { admin: adminMetaByOccurrenceId.get(event.id) }
        : {}),
    })),
  });
}
