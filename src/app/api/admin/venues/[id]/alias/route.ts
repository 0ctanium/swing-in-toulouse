import { NextRequest, NextResponse } from "next/server";

import { assertPlatformAdminApi } from "@/lib/admin/auth";
import { invalidatePublicVenueCache } from "@/lib/cache/invalidate";
import {
  clearVenueAlias,
  VenueCanonicalError,
} from "@/lib/venues/canonical";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const authError = await assertPlatformAdminApi();
  if (authError) {
    return authError;
  }

  const { id } = await context.params;

  try {
    await clearVenueAlias(id);
    invalidatePublicVenueCache();
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof VenueCanonicalError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    throw error;
  }
}
