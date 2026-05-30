import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { sources } from "@/db/schema";
import { assertAdminApi } from "@/lib/admin/auth";
import { generateSourceSlug } from "@/lib/slug";
import {
  getOrganizationById,
  listAdminSources,
  resolveUniqueSourceSlug,
} from "@/lib/sources/admin";
import {
  normalizeSourceCategories,
  sourceWriteSchema,
} from "@/lib/sources/schemas";

export async function GET(request: NextRequest) {
  const authError = await assertAdminApi(request);
  if (authError) {
    return authError;
  }

  const sourcesList = await listAdminSources();
  return NextResponse.json({ sources: sourcesList });
}

export async function POST(request: NextRequest) {
  const authError = await assertAdminApi(request);
  if (authError) {
    return authError;
  }

  const parsed = sourceWriteSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Corps de requête invalide.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const organizationId = parsed.data.organizationId ?? null;

  if (organizationId) {
    const organization = await getOrganizationById(organizationId);

    if (!organization) {
      return NextResponse.json(
        { error: "Organisateur introuvable." },
        { status: 400 },
      );
    }
  }

  const baseSlug =
    parsed.data.slug?.trim() || generateSourceSlug(parsed.data.name);
  const slug = await resolveUniqueSourceSlug(baseSlug);
  const defaultCategories = normalizeSourceCategories(
    parsed.data.defaultCategories,
  );

  const [created] = await db
    .insert(sources)
    .values({
      name: parsed.data.name.trim(),
      slug,
      url: parsed.data.url.trim(),
      type: "ical",
      organizationId,
      defaultLocationRaw: parsed.data.defaultLocationRaw?.trim() || null,
      ...(defaultCategories !== undefined ? { defaultCategories } : {}),
      isActive: parsed.data.isActive ?? true,
    })
    .returning();

  return NextResponse.json({ source: created }, { status: 201 });
}
