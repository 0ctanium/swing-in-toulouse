import { NextRequest, NextResponse } from "next/server";

import {
  requireEventInScope,
  requireOrgScopedApi,
} from "@/lib/admin/api-auth";
import { invalidatePublicEventCache } from "@/lib/cache/invalidate";
import {
  deleteEventOverride,
  getEventWithOverrides,
  upsertEventOverride,
} from "@/lib/events/overrides";
import { eventOverridePatchSchema } from "@/lib/events/overrides.types";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const auth = await requireOrgScopedApi();
  if ("error" in auth) {
    return auth.error;
  }

  const { id } = await context.params;
  const scopeError = await requireEventInScope(id, auth.dataScope);
  if ("error" in scopeError) {
    return scopeError.error;
  }

  const event = await getEventWithOverrides(id);

  if (!event) {
    return NextResponse.json({ error: "Événement introuvable." }, { status: 404 });
  }

  return NextResponse.json(event);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const auth = await requireOrgScopedApi();
  if ("error" in auth) {
    return auth.error;
  }

  const { id } = await context.params;
  const scopeError = await requireEventInScope(id, auth.dataScope);
  if ("error" in scopeError) {
    return scopeError.error;
  }

  const body = (await request.json()) as {
    patch?: unknown;
    occurrenceStartAt?: string | null;
  };

  const parsed = eventOverridePatchSchema.safeParse(body.patch);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Patch invalide.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const occurrenceStartAt = body.occurrenceStartAt
    ? new Date(body.occurrenceStartAt)
    : null;

  const override = await upsertEventOverride({
    eventId: id,
    occurrenceStartAt,
    patch: parsed.data,
  });

  invalidatePublicEventCache();

  return NextResponse.json({ override });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = await requireOrgScopedApi();
  if ("error" in auth) {
    return auth.error;
  }

  const { id } = await context.params;
  const scopeError = await requireEventInScope(id, auth.dataScope);
  if ("error" in scopeError) {
    return scopeError.error;
  }

  const occurrenceStartAtRaw = request.nextUrl.searchParams.get(
    "occurrenceStartAt",
  );

  await deleteEventOverride({
    eventId: id,
    occurrenceStartAt: occurrenceStartAtRaw
      ? new Date(occurrenceStartAtRaw)
      : null,
  });

  invalidatePublicEventCache();

  return NextResponse.json({ ok: true });
}
