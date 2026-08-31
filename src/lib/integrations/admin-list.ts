import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import { integrations } from "@/db/schema";
import type { AdminDataScope } from "@/lib/admin/data-scope";
import { serializeIntegration } from "@/lib/integrations/serialize";

export type AdminIntegrationRow = ReturnType<typeof serializeIntegration> & {
  organizationName: string;
  organizationSlug: string;
  integrationsQuota: number;
};

export async function listAdminIntegrations(
  dataScope: AdminDataScope | { mode: "none" },
): Promise<AdminIntegrationRow[]> {
  if (dataScope.mode === "none") {
    return [];
  }

  const rows = await db.query.integrations.findMany({
    where:
      dataScope.mode === "org"
        ? eq(integrations.organizationId, dataScope.organizationId)
        : undefined,
    orderBy: asc(integrations.createdAt),
    with: {
      organization: {
        columns: {
          name: true,
          slug: true,
          integrationsQuota: true,
        },
      },
    },
  });

  return rows.map((row) => ({
    ...serializeIntegration(row),
    organizationName: row.organization.name,
    organizationSlug: row.organization.slug,
    integrationsQuota: row.organization.integrationsQuota,
  }));
}
