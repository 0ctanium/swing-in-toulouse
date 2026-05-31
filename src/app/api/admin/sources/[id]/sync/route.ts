import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { sources } from "@/db/schema";
import { assertAdminApi } from "@/lib/admin/auth";
import { runSourceSync, sourceSyncResponse } from "@/lib/sources/sync-api";

export const maxDuration = 60;

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const authError = await assertAdminApi(request);
  if (authError) {
    return authError;
  }

  const { id } = await context.params;

  const existing = await db.query.sources.findFirst({
    where: eq(sources.id, id),
    columns: { id: true },
  });

  if (!existing) {
    return Response.json({ error: "Source introuvable." }, { status: 404 });
  }

  const sync = await runSourceSync(id);
  const source = await db.query.sources.findFirst({
    where: eq(sources.id, id),
  });

  if (!source) {
    return Response.json({ error: "Source introuvable." }, { status: 404 });
  }

  return sourceSyncResponse(source, sync);
}
