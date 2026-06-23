import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { sources } from "@/db/schema";
import {
  requireOrgScopedApi,
  requireSourceInScope,
} from "@/lib/admin/api-auth";
import { resolveWritableOrganizationId } from "@/lib/admin/data-scope";
import { invalidateAllPublicCache } from "@/lib/cache/invalidate";
import { deleteIcalBlob } from "@/lib/sources/blob";
import {
  getOrganizationById,
  resolveUniqueSourceSlug,
} from "@/lib/sources/admin";
import {
  normalizeSourceCategories,
  sourcePatchSchema,
} from "@/lib/sources/schemas";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await requireOrgScopedApi();
  if ("error" in auth) {
    return auth.error;
  }

  const { id } = await context.params;
  const scopeError = await requireSourceInScope(id, auth.dataScope);
  if ("error" in scopeError) {
    return scopeError.error;
  }

  const parsed = sourcePatchSchema.safeParse(await request.json());

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

  if (parsed.data.url !== undefined && existing.type === "ical-file") {
    return NextResponse.json(
      { error: "Les sources fichier n'acceptent pas d'URL." },
      { status: 400 },
    );
  }

  const organizationId =
    parsed.data.organizationId !== undefined
      ? resolveWritableOrganizationId(
          auth.dataScope,
          parsed.data.organizationId,
        )
      : undefined;

  if (organizationId) {
    const organization = await getOrganizationById(organizationId);

    if (!organization) {
      return NextResponse.json(
        { error: "Organisateur introuvable." },
        { status: 400 },
      );
    }
  }

  let slug = existing.slug;

  if (parsed.data.slug !== undefined) {
    slug = await resolveUniqueSourceSlug(parsed.data.slug.trim(), id);
  }

  const defaultCategories = normalizeSourceCategories(
    parsed.data.defaultCategories,
  );

  const [updated] = await db
    .update(sources)
    .set({
      ...(parsed.data.name !== undefined
        ? { name: parsed.data.name.trim() }
        : {}),
      ...(parsed.data.slug !== undefined ? { slug } : {}),
      ...(parsed.data.url !== undefined && existing.type === "ical"
        ? { url: parsed.data.url.trim() }
        : {}),
      ...(organizationId !== undefined ? { organizationId } : {}),
      ...(parsed.data.defaultLocationRaw !== undefined
        ? {
            defaultLocationRaw:
              parsed.data.defaultLocationRaw?.trim() || null,
          }
        : {}),
      ...(defaultCategories !== undefined ? { defaultCategories } : {}),
      ...(parsed.data.isActive !== undefined
        ? { isActive: parsed.data.isActive }
        : {}),
    })
    .where(eq(sources.id, id))
    .returning();

  invalidateAllPublicCache();

  return NextResponse.json({ source: updated });
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const auth = await requireOrgScopedApi();
  if ("error" in auth) {
    return auth.error;
  }

  const { id } = await context.params;
  const scopeError = await requireSourceInScope(id, auth.dataScope);
  if ("error" in scopeError) {
    return scopeError.error;
  }

  const existing = await db.query.sources.findFirst({
    where: eq(sources.id, id),
    columns: {
      id: true,
      name: true,
      type: true,
      icalBlobUrl: true,
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Source introuvable." }, { status: 404 });
  }

  if (existing.type === "ical-file" && existing.icalBlobUrl) {
    await deleteIcalBlob(existing.icalBlobUrl).catch(() => undefined);
  }

  await db.delete(sources).where(eq(sources.id, id));

  invalidateAllPublicCache();

  return NextResponse.json({ success: true });
}
