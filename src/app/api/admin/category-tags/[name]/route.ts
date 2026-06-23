import { NextRequest, NextResponse } from "next/server";

import { assertPlatformAdminApi } from "@/lib/admin/auth";
import { invalidateCategoryTagMetadataCache } from "@/lib/cache/invalidate";
import { updateCategoryTag } from "@/lib/event-category-tags/admin";
import { updateCategoryTagSchema } from "@/lib/event-category-tags/schemas";

type RouteContext = {
  params: Promise<{ name: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const authError = await assertPlatformAdminApi();
  if (authError) {
    return authError;
  }

  const { name: encodedName } = await context.params;
  const name = decodeURIComponent(encodedName);
  const parsed = updateCategoryTagSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Corps de requête invalide.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json(
      { error: "Aucune modification fournie." },
      { status: 400 },
    );
  }

  try {
    const tag = await updateCategoryTag(name, parsed.data);
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
