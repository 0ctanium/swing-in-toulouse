import { eq } from "drizzle-orm";

import { db } from "@/db";
import { integrations } from "@/db/schema";
import { isIntegrationAccessible } from "@/lib/organizations/integrations";

export async function getEmbeddedIntegrationById(integrationId: string) {
  const integration = await db.query.integrations.findFirst({
    where: eq(integrations.id, integrationId),
    with: {
      organization: true,
    },
  });

  if (!integration?.organization) {
    return null;
  }

  if (!isIntegrationAccessible(integration, integration.organization)) {
    return null;
  }

  return {
    organization: integration.organization,
    integration,
  };
}
