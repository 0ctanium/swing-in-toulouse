import { endOfDay, startOfDay } from "date-fns";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getUpcomingEvents } from "@/lib/events/queries";
import { serializeOccurrence } from "@/lib/events/serialize";

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

  return NextResponse.json({
    events: events.map(serializeOccurrence),
  });
}
