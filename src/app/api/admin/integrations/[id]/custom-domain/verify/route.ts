import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/db";
import { integrations } from "@/db/schema";
import { invalidatePublicOrganizerCache } from "@/lib/cache/invalidate";
import { getIntegrationForAdminScope } from "@/lib/integrations/access";
import { serializeIntegrationDomain } from "@/lib/integrations/serialize";
import {
  getCustomDomainStatus,
} from "@/lib/organizations/custom-domain";
import { assertOrgScopedApi } from "@/lib/admin/auth";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(_request: NextRequest, context: RouteContext) {
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

  if (!integration.customDomain) {
    return NextResponse.json(
      { error: "Aucun domaine à vérifier." },
      { status: 400 },
    );
  }

  const status = await getCustomDomainStatus(integration.customDomain);
  const [updated] = await db
    .update(integrations)
    .set({
      customDomainStatus: status.verified ? "verified" : "pending",
      customDomainVerifiedAt: status.verified ? new Date() : null,
    })
    .where(eq(integrations.id, integration.id))
    .returning();

  invalidatePublicOrganizerCache();

  return NextResponse.json({
    domain: serializeIntegrationDomain(updated, status.records),
  });
}
