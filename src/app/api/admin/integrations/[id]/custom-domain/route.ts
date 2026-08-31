import { and, eq, ne } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { db } from "@/db";
import { integrations } from "@/db/schema";
import { assertOrgScopedApi } from "@/lib/admin/auth";
import { invalidatePublicOrganizerCache } from "@/lib/cache/invalidate";
import { getIntegrationForAdminScope } from "@/lib/integrations/access";
import { serializeIntegrationDomain } from "@/lib/integrations/serialize";
import {
  getCustomDomainStatus,
  registerCustomDomain,
  removeCustomDomain,
} from "@/lib/organizations/custom-domain";
import { normalizeCustomDomain } from "@/lib/organizations/custom-domain-validation";

const customDomainSchema = z.object({
  domain: z.string().trim().min(1, "Le domaine est requis."),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

async function getApiIntegration(id: string) {
  const auth = await assertOrgScopedApi();

  if ("error" in auth) {
    return { error: auth.error };
  }

  const result = await getIntegrationForAdminScope(auth.dataScope, id);

  if ("error" in result) {
    return {
      error: NextResponse.json(
        { error: result.error.message },
        { status: result.error.status },
      ),
    };
  }

  return { integration: result.integration };
}

export async function GET(
  _request: NextRequest,
  context: RouteContext,
) {
  const { id } = await context.params;
  const result = await getApiIntegration(id);

  if ("error" in result) {
    return result.error;
  }

  const { integration } = result;

  if (!integration.customDomain) {
    return NextResponse.json({
      domain: serializeIntegrationDomain(integration),
    });
  }

  const status = await getCustomDomainStatus(integration.customDomain);

  return NextResponse.json({
    domain: serializeIntegrationDomain(integration, status.records),
  });
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const result = await getApiIntegration(id);

  if ("error" in result) {
    return result.error;
  }

  const parsed = customDomainSchema.safeParse(await request.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Corps de requête invalide.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  let domain: string;

  try {
    domain = normalizeCustomDomain(parsed.data.domain);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Le domaine est invalide.",
      },
      { status: 400 },
    );
  }

  const { integration } = result;
  const existingDomainOwner = await db.query.integrations.findFirst({
    where: and(
      eq(integrations.customDomain, domain),
      ne(integrations.id, integration.id),
    ),
    columns: { id: true },
  });

  if (existingDomainOwner) {
    return NextResponse.json(
      { error: "Ce domaine est déjà utilisé par une autre intégration." },
      { status: 409 },
    );
  }

  if (integration.customDomain && integration.customDomain !== domain) {
    await removeCustomDomain(integration.customDomain).catch(() => undefined);
  }

  const status = await registerCustomDomain(domain);
  const [updated] = await db
    .update(integrations)
    .set({
      customDomain: domain,
      customDomainStatus: status.verified ? "verified" : "pending",
      customDomainAddedAt: new Date(),
      customDomainVerifiedAt: status.verified ? new Date() : null,
    })
    .where(eq(integrations.id, integration.id))
    .returning();

  invalidatePublicOrganizerCache();

  return NextResponse.json({
    domain: serializeIntegrationDomain(updated, status.records),
  });
}

export async function DELETE(
  _request: NextRequest,
  context: RouteContext,
) {
  const { id } = await context.params;
  const result = await getApiIntegration(id);

  if ("error" in result) {
    return result.error;
  }

  const { integration } = result;

  if (integration.customDomain) {
    await removeCustomDomain(integration.customDomain).catch(() => undefined);
  }

  const [updated] = await db
    .update(integrations)
    .set({
      customDomain: null,
      customDomainStatus: "none",
      customDomainAddedAt: null,
      customDomainVerifiedAt: null,
    })
    .where(eq(integrations.id, integration.id))
    .returning();

  invalidatePublicOrganizerCache();

  return NextResponse.json({
    domain: serializeIntegrationDomain(updated),
  });
}
