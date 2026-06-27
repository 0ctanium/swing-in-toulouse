import { NextResponse } from "next/server";

import { requireOrgScopedApi } from "@/lib/admin/api-auth";
import { getEventCategoryTagSelectOptions } from "@/lib/event-category-tags/select-options";

export async function GET() {
  const auth = await requireOrgScopedApi();
  if ("error" in auth) {
    return auth.error;
  }

  const categoryGroups = await getEventCategoryTagSelectOptions();

  return NextResponse.json({ categoryGroups });
}
