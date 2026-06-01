import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { assertAdminApi } from "@/lib/admin/auth";
import { dismissVenueMergePairs } from "@/lib/venues/merge-dismissals";

const bodySchema = z.object({
  venueIds: z.array(z.string().uuid()).min(2),
});

export async function POST(request: NextRequest) {
  const authError = await assertAdminApi(request);
  if (authError) {
    return authError;
  }

  const parsed = bodySchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Corps de requête invalide.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const result = await dismissVenueMergePairs(parsed.data.venueIds);

  return NextResponse.json(result);
}
