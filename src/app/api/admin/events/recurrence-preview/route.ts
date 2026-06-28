import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireOrgScopedApi } from "@/lib/admin/api-auth";
import { recurrenceFormSchema } from "@/lib/events/manual-event-schema";
import { previewRecurrenceOccurrences } from "@/lib/events/recurrence-rule-preview";
import { generateEventUid } from "@/lib/ical/uid";

const previewBodySchema = z.object({
  startAt: z.string().datetime(),
  endAt: z.string().datetime().nullable().optional(),
  isAllDay: z.boolean().default(false),
  recurrence: recurrenceFormSchema,
});

export async function POST(request: NextRequest) {
  const auth = await requireOrgScopedApi();
  if ("error" in auth) {
    return auth.error;
  }

  const parsed = previewBodySchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Corps de requête invalide." },
      { status: 400 },
    );
  }

  const startAt = new Date(parsed.data.startAt);
  const endAt = parsed.data.endAt ? new Date(parsed.data.endAt) : null;

  const occurrences = await previewRecurrenceOccurrences(
    parsed.data.recurrence,
    {
      uid: generateEventUid(),
      title: "Aperçu",
      startAt,
      endAt,
      isAllDay: parsed.data.isAllDay,
    },
  );

  return NextResponse.json({ occurrences });
}
