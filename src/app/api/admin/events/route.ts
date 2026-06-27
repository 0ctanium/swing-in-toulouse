import { NextRequest, NextResponse } from "next/server";

import { requireOrgScopedApi } from "@/lib/admin/api-auth";
import { invalidateAllPublicCache } from "@/lib/cache/invalidate";
import { createManualEvent } from "@/lib/events/create-manual-event";
import { manualEventWriteSchema } from "@/lib/events/manual-event-schema";

export async function POST(request: NextRequest) {
  const auth = await requireOrgScopedApi();
  if ("error" in auth) {
    return auth.error;
  }

  const parsed = manualEventWriteSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Corps de requête invalide.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const event = await createManualEvent(parsed.data, auth.dataScope);
    invalidateAllPublicCache();

    return NextResponse.json({ event }, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Création impossible.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
