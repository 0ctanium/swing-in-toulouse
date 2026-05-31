import { NextRequest } from "next/server";

import { assertAdminApi } from "@/lib/admin/auth";
import { replaceIcalFileSource } from "@/lib/sources/file-source";
import { sourceSyncResponse } from "@/lib/sources/sync-api";

export const maxDuration = 60;

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: NextRequest, context: RouteContext) {
  const authError = await assertAdminApi(request);
  if (authError) {
    return authError;
  }

  const { id } = await context.params;
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return Response.json({ error: "Fichier iCal requis." }, { status: 400 });
  }

  try {
    const result = await replaceIcalFileSource(id, file);
    return sourceSyncResponse(result.source, result.sync);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Mise à jour impossible.";

    return Response.json({ error: message }, { status: 400 });
  }
}
