import { NextRequest, NextResponse } from "next/server";

import { assertPlatformAdminApi } from "@/lib/admin/auth";
import { listAdminCategoryTags } from "@/lib/event-category-tags/admin";
import { patchCategoryTagResponse } from "@/lib/event-category-tags/patch-category-tag";
import { patchCategoryTagRequestSchema } from "@/lib/event-category-tags/patch-schema";

export async function GET(request: NextRequest) {
  const authError = await assertPlatformAdminApi();
  if (authError) {
    return authError;
  }

  const page = Math.max(
    1,
    Number.parseInt(request.nextUrl.searchParams.get("page") ?? "1", 10) || 1,
  );
  const search = request.nextUrl.searchParams.get("search")?.trim() ?? "";

  const result = await listAdminCategoryTags({ page, search });

  return NextResponse.json(result);
}

export async function PATCH(request: NextRequest) {
  const authError = await assertPlatformAdminApi();
  if (authError) {
    return authError;
  }

  const parsed = patchCategoryTagRequestSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Corps de requête invalide.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { name, ...input } = parsed.data;

  return patchCategoryTagResponse(name, input);
}
