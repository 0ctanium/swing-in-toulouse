import { NextRequest, NextResponse } from "next/server";

import { assertAdminApi } from "@/lib/admin/auth";
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
  const authError = await assertAdminApi();
  if (authError) {
    return authError;
  }

  const { id } = await context.params;
  const event = await getEventWithOverrides(id);

  if (!event) {
    return NextResponse.json({ error: "Événement introuvable." }, { status: 404 });
  }

  return NextResponse.json(event);
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const authError = await assertAdminApi(request);
  if (authError) {
    return authError;
  }

  const { id } = await context.params;
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

  return NextResponse.json({ override });
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const authError = await assertAdminApi(request);
  if (authError) {
    return authError;
  }

  const { id } = await context.params;
  const occurrenceStartAtRaw = request.nextUrl.searchParams.get(
    "occurrenceStartAt",
  );

  await deleteEventOverride({
    eventId: id,
    occurrenceStartAt: occurrenceStartAtRaw
      ? new Date(occurrenceStartAtRaw)
      : null,
  });

  return NextResponse.json({ ok: true });
}
