import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { integrations } from "@/db/schema";
import { assertOrgScopedApi } from "@/lib/admin/auth";
import { invalidatePublicOrganizerCache } from "@/lib/cache/invalidate";
import { getIntegrationForAdminScope } from "@/lib/integrations/access";
import { serializeIntegration } from "@/lib/integrations/serialize";
import { integrationPatchSchema } from "@/lib/integrations/schemas";
import { removeCustomDomain } from "@/lib/organizations/custom-domain";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const auth = await assertOrgScopedApi();

  if ("error" in auth) {
    return auth.error;
  }

  const { id } = await context.params;
  const result = await getIntegrationForAdminScope(auth.dataScope, id);

  if ("error" in result) {
    return NextResponse.json(
      { error: result.error.message },
      { status: result.error.status },
    );
  }

  return NextResponse.json({
    integration: serializeIntegration(result.integration),
  });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await assertOrgScopedApi();

  if ("error" in auth) {
    return auth.error;
  }

  const { id } = await context.params;
  const result = await getIntegrationForAdminScope(auth.dataScope, id);

  if ("error" in result) {
    return NextResponse.json(
      { error: result.error.message },
      { status: result.error.status },
    );
  }

  const parsed = integrationPatchSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Corps de requête invalide.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { integration } = result;

  const [updated] = await db
    .update(integrations)
    .set({
      ...(parsed.data.name !== undefined
        ? { name: parsed.data.name.trim() }
        : {}),
      ...(parsed.data.isActive !== undefined
        ? { isActive: parsed.data.isActive }
        : {}),
      ...(parsed.data.theme !== undefined ? { theme: parsed.data.theme } : {}),
      ...(parsed.data.baseFilters !== undefined
        ? { baseFilters: parsed.data.baseFilters }
        : {}),
    })
    .where(eq(integrations.id, integration.id))
    .returning();

  invalidatePublicOrganizerCache();

  return NextResponse.json({ integration: serializeIntegration(updated) });
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const auth = await assertOrgScopedApi();

  if ("error" in auth) {
    return auth.error;
  }

  const { id } = await context.params;
  const result = await getIntegrationForAdminScope(auth.dataScope, id);

  if ("error" in result) {
    return NextResponse.json(
      { error: result.error.message },
      { status: result.error.status },
    );
  }

  const { integration } = result;

  if (integration.customDomain) {
    await removeCustomDomain(integration.customDomain).catch(() => undefined);
  }

  await db.delete(integrations).where(eq(integrations.id, integration.id));

  invalidatePublicOrganizerCache();

  return new NextResponse(null, { status: 204 });
}
