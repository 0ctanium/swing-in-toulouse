import { NextRequest, NextResponse } from "next/server";
import { asc } from "drizzle-orm";

import { db } from "@/db";
import { sources } from "@/db/schema";
import { assertAdminApi } from "@/lib/admin/auth";

export async function GET(request: NextRequest) {
  const authError = await assertAdminApi(request);
  if (authError) {
    return authError;
  }

  const rows = await db.query.sources.findMany({
    orderBy: asc(sources.name),
    with: {
      organization: true,
    },
  });

  return NextResponse.json({ sources: rows });
}
