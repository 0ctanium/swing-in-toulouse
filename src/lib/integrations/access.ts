import { and, count, eq } from "drizzle-orm";

import { db } from "@/db";
import { integrations, type Organization } from "@/db/schema";
import type { AdminDataScope } from "@/lib/admin/data-scope";
import { hasIntegrationsEntitlement } from "@/lib/organizations/integrations";

export type IntegrationAccessError = {
  status: 400 | 403 | 404;
  message: string;
};

export function getIntegrationOrgAccessError(
  dataScope: AdminDataScope,
  organization:
    | Pick<Organization, "integrationsQuota" | "isActive">
    | null
    | undefined,
): IntegrationAccessError | null {
  if (dataScope.mode === "all") {
    return null;
  }

  if (!organization) {
    return {
      status: 404,
      message: "Organisateur introuvable.",
    };
  }

  if (!hasIntegrationsEntitlement(organization)) {
    return {
      status: 403,
      message:
        "Les intégrations personnalisées ne sont pas activées pour cet organisateur.",
    };
  }

  return null;
}

export async function getIntegrationForAdminScope(
  dataScope: AdminDataScope,
  integrationId: string,
) {
  const integration = await db.query.integrations.findFirst({
    where:
      dataScope.mode === "org"
        ? and(
            eq(integrations.id, integrationId),
            eq(integrations.organizationId, dataScope.organizationId),
          )
        : eq(integrations.id, integrationId),
    with: {
      organization: true,
    },
  });

  if (!integration) {
    return {
      error: { status: 404 as const, message: "Intégration introuvable." },
    };
  }

  const accessError = getIntegrationOrgAccessError(
    dataScope,
    integration.organization,
  );

  if (accessError) {
    return { error: accessError };
  }

  return { integration };
}

/** @deprecated Use getIntegrationForAdminScope */
export const getIntegrationForOrgScope = getIntegrationForAdminScope;

export async function countOrganizationIntegrations(organizationId: string) {
  const [result] = await db
    .select({ value: count() })
    .from(integrations)
    .where(eq(integrations.organizationId, organizationId));

  return result?.value ?? 0;
}
