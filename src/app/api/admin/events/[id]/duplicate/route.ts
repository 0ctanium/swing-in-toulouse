import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { assertAdminApi } from "@/lib/admin/auth";
import { invalidatePublicEventCache } from "@/lib/cache/invalidate";
import {
  DuplicateLinkError,
  findDuplicateCandidates,
  getDuplicateLinkInfo,
  linkDuplicateEvent,
  unlinkDuplicateEvent,
} from "@/lib/events/duplicates";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const linkBodySchema = z.object({
  canonicalEventId: z.string().uuid(),
});

export async function GET(_request: NextRequest, context: RouteContext) {
  const authError = await assertAdminApi();
  if (authError) {
    return authError;
  }

  const { id } = await context.params;
  const info = await getDuplicateLinkInfo(id);

  if (!info) {
    return NextResponse.json({ error: "Événement introuvable." }, { status: 404 });
  }

  const candidates =
    info.event.canonicalEventId || info.linkedDuplicates.length > 0
      ? []
      : await findDuplicateCandidates(id);

  return NextResponse.json({
    event: info.event,
    canonicalEvent: info.canonicalEvent,
    linkedDuplicates: info.linkedDuplicates,
    candidates,
  });
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const authError = await assertAdminApi(request);
  if (authError) {
    return authError;
  }

  const { id } = await context.params;
  const body = linkBodySchema.safeParse(await request.json());

  if (!body.success) {
    return NextResponse.json(
      { error: "Corps de requête invalide.", details: body.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const updated = await linkDuplicateEvent(id, body.data.canonicalEventId);
    const info = await getDuplicateLinkInfo(updated.id);
    invalidatePublicEventCache();
    return NextResponse.json(info);
  } catch (error) {
    if (error instanceof DuplicateLinkError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    throw error;
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const authError = await assertAdminApi();
  if (authError) {
    return authError;
  }

  const { id } = await context.params;

  try {
    await unlinkDuplicateEvent(id);
    const info = await getDuplicateLinkInfo(id);
    invalidatePublicEventCache();
    return NextResponse.json(info);
  } catch (error) {
    if (error instanceof DuplicateLinkError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    throw error;
  }
}
