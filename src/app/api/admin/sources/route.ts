import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { sources } from "@/db/schema";
import {
  requireOrgScopedApi,
} from "@/lib/admin/api-auth";
import { invalidateAllPublicCache } from "@/lib/cache/invalidate";
import { resolveWritableOrganizationId } from "@/lib/admin/data-scope";
import { generateSourceSlug } from "@/lib/slug";
import {
  getOrganizationById,
  listAdminSources,
  resolveUniqueSourceSlug,
} from "@/lib/sources/admin";
import { createIcalFileSource } from "@/lib/sources/file-source";
import {
  normalizeSourceCategories,
  parseSourceFormFields,
  sourceWriteSchema,
} from "@/lib/sources/schemas";
import { sourceSyncResponse } from "@/lib/sources/sync-api";

export const maxDuration = 60;

export async function GET() {
  const auth = await requireOrgScopedApi();
  if ("error" in auth) {
    return auth.error;
  }

  const sourcesList = await listAdminSources(auth.dataScope);
  return NextResponse.json({ sources: sourcesList });
}

export async function POST(request: NextRequest) {
  const auth = await requireOrgScopedApi();
  if ("error" in auth) {
    return auth.error;
  }

  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    return handleCreateFileSource(request, auth.dataScope);
  }

  const parsed = sourceWriteSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Corps de requête invalide.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const organizationId = resolveWritableOrganizationId(
    auth.dataScope,
    parsed.data.organizationId,
  );

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

  invalidateAllPublicCache();

  return NextResponse.json({ source: created }, { status: 201 });
}

async function handleCreateFileSource(
  request: NextRequest,
  dataScope: Parameters<typeof resolveWritableOrganizationId>[0],
) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Fichier iCal requis." },
      { status: 400 },
    );
  }

  const fields = parseSourceFormFields(formData);
  fields.organizationId = resolveWritableOrganizationId(
    dataScope,
    fields.organizationId,
  );

  try {
    const result = await createIcalFileSource(fields, file);
    invalidateAllPublicCache();

    return sourceSyncResponse(result.source, result.sync, 201);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Création impossible.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
