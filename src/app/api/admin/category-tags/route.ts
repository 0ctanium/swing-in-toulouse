import { NextRequest, NextResponse } from "next/server";

import { assertAdminApi } from "@/lib/admin/auth";
import { listAdminCategoryTags } from "@/lib/event-category-tags/admin";

export async function GET(request: NextRequest) {
  const authError = await assertAdminApi(request);
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
