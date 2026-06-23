import { endOfDay, startOfDay } from "date-fns";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { loadPublicEventsForRange } from "@/lib/events/public-events-loader";

const querySchema = z.object({
  from: z.coerce.date(),
  to: z.coerce.date(),
  limit: z.coerce.number().optional(),
});

export async function GET(request: NextRequest) {
  const parsed = querySchema.safeParse({
    from: request.nextUrl.searchParams.get("from"),
    to: request.nextUrl.searchParams.get("to"),
    limit: request.nextUrl.searchParams.get("limit"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Paramètres from et to requis (ISO 8601)." },
      { status: 400 },
    );
  }

  const { from, to, limit } = parsed.data;

  if (from > to) {
    return NextResponse.json(
      { error: "from doit être antérieur à to." },
      { status: 400 },
    );
  }

  const events = await loadPublicEventsForRange(
    startOfDay(from),
    endOfDay(to),
    limit,
  );

  return NextResponse.json({ events });
}
