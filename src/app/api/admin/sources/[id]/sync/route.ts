import { eq } from "drizzle-orm";

import { db } from "@/db";
import { sources } from "@/db/schema";
import {
  requireOrgScopedApi,
  requireSourceInScope,
} from "@/lib/admin/api-auth";
import { runSourceSync, sourceSyncResponse } from "@/lib/sources/sync-api";

export const maxDuration = 60;

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const auth = await requireOrgScopedApi();
  if ("error" in auth) {
    return auth.error;
  }

  const { id } = await context.params;
  const scopeError = await requireSourceInScope(id, auth.dataScope);
  if ("error" in scopeError) {
    return scopeError.error;
  }

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
