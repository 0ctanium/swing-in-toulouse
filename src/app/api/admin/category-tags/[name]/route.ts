import { NextRequest, NextResponse } from "next/server";

import { assertPlatformAdminApi } from "@/lib/admin/auth";
import { patchCategoryTagResponse } from "@/lib/event-category-tags/patch-category-tag";
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

  return patchCategoryTagResponse(name, parsed.data);
}
