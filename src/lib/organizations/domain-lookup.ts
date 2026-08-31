import { and, eq } from "drizzle-orm";

import { db } from "@/db";
import { integrations, organizations } from "@/db/schema";

import { normalizeRequestHost } from "./domain-host";

export { isPrimaryOrLocalHost, normalizeRequestHost } from "./domain-host";

export async function getIntegrationByVerifiedDomain(host: string) {
  const domain = normalizeRequestHost(host)?.replace(/^www\./, "");

  if (!domain) {
    return null;
  }

  const integration = await db.query.integrations.findFirst({
    where: and(
      eq(integrations.customDomain, domain),
      eq(integrations.customDomainStatus, "verified"),
      eq(integrations.isActive, true),
    ),
    with: {
      organization: {
        columns: {
          id: true,
          slug: true,
          isActive: true,
          integrationsQuota: true,
        },
      },
    },
  });

  if (
    !integration?.organization?.isActive ||
    integration.organization.integrationsQuota <= 0
  ) {
    return null;
  }

  return {
    integrationId: integration.id,
  };
}
