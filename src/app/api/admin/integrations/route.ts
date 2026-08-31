import { asc, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { integrations, organizations } from "@/db/schema";
import { assertOrgScopedApi } from "@/lib/admin/auth";
import { invalidatePublicOrganizerCache } from "@/lib/cache/invalidate";
import {
  countOrganizationIntegrations,
  getIntegrationOrgAccessError,
} from "@/lib/integrations/access";
import { serializeIntegration } from "@/lib/integrations/serialize";
import { integrationWriteSchema } from "@/lib/integrations/schemas";
import { canCreateIntegration } from "@/lib/organizations/integrations";

async function getScopedOrganization(organizationId?: string | null) {
  const auth = await assertOrgScopedApi();

  if ("error" in auth) {
    return { error: auth.error };
  }

  const scopedOrganizationId =
    auth.dataScope.mode === "org"
      ? auth.dataScope.organizationId
      : organizationId;

  if (!scopedOrganizationId) {
    return {
      error: NextResponse.json(
        { error: "Sélectionnez une organisation avant de continuer." },
        { status: 400 },
      ),
    };
  }

  const organization = await db.query.organizations.findFirst({
    where: eq(organizations.id, scopedOrganizationId),
  });

  if (!organization) {
    return {
      error: NextResponse.json(
        { error: "Organisateur introuvable." },
        { status: 404 },
      ),
    };
  }

  const accessError = getIntegrationOrgAccessError(
    auth.dataScope,
    organization,
  );

  if (accessError) {
    return {
      error: NextResponse.json(
        { error: accessError.message },
        { status: accessError.status },
      ),
    };
  }

  return { organization: organization!, dataScope: auth.dataScope };
}

export async function GET(request: NextRequest) {
  const auth = await assertOrgScopedApi();

  if ("error" in auth) {
    return auth.error;
  }

  const requestedOrganizationId =
    request.nextUrl.searchParams.get("organizationId");
  const scopedOrganizationId =
    auth.dataScope.mode === "org"
      ? auth.dataScope.organizationId
      : requestedOrganizationId;

  if (!scopedOrganizationId && auth.dataScope.mode === "all") {
    const rows = await db.query.integrations.findMany({
      orderBy: asc(integrations.createdAt),
    });

    return NextResponse.json({
      integrations: rows.map(serializeIntegration),
      quota: null,
      count: rows.length,
    });
  }

  const result = await getScopedOrganization(scopedOrganizationId);

  if ("error" in result) {
    return result.error;
  }

  const rows = await db.query.integrations.findMany({
    where: eq(integrations.organizationId, result.organization.id),
    orderBy: asc(integrations.createdAt),
  });

  return NextResponse.json({
    integrations: rows.map(serializeIntegration),
    quota: result.organization.integrationsQuota,
    count: rows.length,
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const result = await getScopedOrganization(
    typeof body.organizationId === "string" ? body.organizationId : null,
  );

  if ("error" in result) {
    return result.error;
  }

  const parsed = integrationWriteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Corps de requête invalide.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const currentCount = await countOrganizationIntegrations(
    result.organization.id,
  );

  if (!canCreateIntegration(result.organization, currentCount)) {
    return NextResponse.json(
      {
        error:
          "Quota d'intégrations atteint. Contactez l'équipe Swingin Toulouse pour en ajouter.",
      },
      { status: 403 },
    );
  }

  const [created] = await db
    .insert(integrations)
    .values({
      organizationId: result.organization.id,
      name: parsed.data.name.trim(),
      isActive: parsed.data.isActive ?? true,
      theme: parsed.data.theme ?? null,
      baseFilters: parsed.data.baseFilters ?? null,
    })
    .returning();

  invalidatePublicOrganizerCache();

  return NextResponse.json(
    { integration: serializeIntegration(created) },
    { status: 201 },
  );
}
