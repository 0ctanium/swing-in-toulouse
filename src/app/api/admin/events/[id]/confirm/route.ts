import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { assertAdminApi } from "@/lib/admin/auth";
import { confirmEvent } from "@/lib/events/confirm-event";
import { eventOverridePatchSchema } from "@/lib/events/overrides.types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const bodySchema = z.object({
  patch: eventOverridePatchSchema.optional().default({}),
});

export async function POST(request: NextRequest, context: RouteContext) {
  const authError = await assertAdminApi(request);
  if (authError) {
    return authError;
  }

  const { id } = await context.params;
  const rawBody = await request.json().catch(() => ({}));
  const body = bodySchema.safeParse(rawBody);

  if (!body.success) {
    return NextResponse.json(
      { error: "Données invalides.", details: body.error.flatten() },
      { status: 400 },
    );
  }

  const updated = await confirmEvent(id, body.data.patch);

  if (!updated) {
    return NextResponse.json(
      { error: "Événement introuvable." },
      { status: 404 },
    );
  }

  return NextResponse.json({ event: updated });
}
