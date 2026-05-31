import { NextRequest, NextResponse } from "next/server";

import { assertAdminApi } from "@/lib/admin/auth";
import { invalidateCategoryTagMetadataCache } from "@/lib/cache/invalidate";
import { upsertCategoryTagMetadata } from "@/lib/event-category-tags/admin";
import { eventCategoryTagMetadataSchema } from "@/lib/event-category-tags/schemas";

type RouteContext = {
  params: Promise<{ name: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const authError = await assertAdminApi(request);
  if (authError) {
    return authError;
  }

  const { name: encodedName } = await context.params;
  const name = decodeURIComponent(encodedName);
  const parsed = eventCategoryTagMetadataSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Corps de requête invalide.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const tag = await upsertCategoryTagMetadata(name, parsed.data.tagType);
    invalidateCategoryTagMetadataCache();

    return NextResponse.json({ tag });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Enregistrement impossible.",
      },
      { status: 400 },
    );
  }
}
