import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import {
  requireEventInScope,
  requireOrgScopedApi,
} from "@/lib/admin/api-auth";
import { invalidatePublicEventCache } from "@/lib/cache/invalidate";
import { confirmEvent } from "@/lib/events/confirm-event";
import { eventOverridePatchSchema } from "@/lib/events/overrides.types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const bodySchema = z.object({
  patch: eventOverridePatchSchema.optional().default({}),
});

export async function POST(request: NextRequest, context: RouteContext) {
  const auth = await requireOrgScopedApi();
  if ("error" in auth) {
    return auth.error;
  }

  const { id } = await context.params;
  const scopeError = await requireEventInScope(id, auth.dataScope);
  if ("error" in scopeError) {
    return scopeError.error;
  }

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

  invalidatePublicEventCache();

  return NextResponse.json({ event: updated });
}
