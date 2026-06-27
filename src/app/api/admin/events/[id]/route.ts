import { NextRequest, NextResponse } from "next/server";

import {
  requireEventInScope,
  requireOrgScopedApi,
  requirePlatformAdminApi,
} from "@/lib/admin/api-auth";
import { invalidateAllPublicCache } from "@/lib/cache/invalidate";
import { ManualEventError } from "@/lib/events/manual-event-helpers";
import { manualEventWriteSchema } from "@/lib/events/manual-event-schema";
import {
  cancelManualEvent,
  deleteManualEvent,
  updateManualEvent,
} from "@/lib/events/update-manual-event";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function manualEventErrorResponse(error: unknown) {
  const message =
    error instanceof ManualEventError
      ? error.message
      : error instanceof Error
        ? error.message
        : "Opération impossible.";

  return NextResponse.json({ error: message }, { status: 400 });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await requireOrgScopedApi();
  if ("error" in auth) {
    return auth.error;
  }

  const { id } = await context.params;
  const scopeError = await requireEventInScope(id, auth.dataScope);
  if ("error" in scopeError) {
    return scopeError.error;
  }

  const parsed = manualEventWriteSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Corps de requête invalide.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const event = await updateManualEvent(id, parsed.data, auth.dataScope);
    invalidateAllPublicCache();

    return NextResponse.json({ event });
  } catch (error) {
    return manualEventErrorResponse(error);
  }
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

  const permanent = request.nextUrl.searchParams.get("permanent") === "1";

  if (permanent) {
    const platformAuth = await requirePlatformAdminApi();
    if ("error" in platformAuth) {
      return platformAuth.error;
    }
  }

  try {
    if (permanent) {
      const deleted = await deleteManualEvent(id);
      invalidateAllPublicCache();
      return NextResponse.json({ deleted });
    }

    const event = await cancelManualEvent(id);
    invalidateAllPublicCache();
    return NextResponse.json({ event });
  } catch (error) {
    return manualEventErrorResponse(error);
  }
}
