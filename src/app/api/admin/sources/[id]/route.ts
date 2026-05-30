import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { sources } from "@/db/schema";
import { assertAdminApi } from "@/lib/admin/auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const bodySchema = z.object({
  defaultLocationRaw: z.string().nullable().optional(),
  defaultCategories: z.array(z.string()).nullable().optional(),
});

function normalizeCategories(categories: string[] | null | undefined) {
  if (categories === null) {
    return null;
  }

  if (!categories) {
    return undefined;
  }

  const normalized = categories
    .map((category) => category.trim())
    .filter(Boolean);

  return normalized.length > 0 ? normalized : null;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const authError = await assertAdminApi(request);
  if (authError) {
    return authError;
  }

  const { id } = await context.params;
  const parsed = bodySchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Corps de requête invalide.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const existing = await db.query.sources.findFirst({
    where: eq(sources.id, id),
  });

  if (!existing) {
    return NextResponse.json({ error: "Source introuvable." }, { status: 404 });
  }

  const defaultCategories = normalizeCategories(parsed.data.defaultCategories);

  const [updated] = await db
    .update(sources)
    .set({
      ...(parsed.data.defaultLocationRaw !== undefined
        ? { defaultLocationRaw: parsed.data.defaultLocationRaw?.trim() || null }
        : {}),
      ...(defaultCategories !== undefined ? { defaultCategories } : {}),
    })
    .where(eq(sources.id, id))
    .returning();

  return NextResponse.json({ source: updated });
}
