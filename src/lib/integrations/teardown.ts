import { eq } from "drizzle-orm";

import { db } from "@/db";
import { integrations } from "@/db/schema";
import { removeCustomDomain } from "@/lib/organizations/custom-domain";

export async function clearOrganizationIntegrationDomains(organizationId: string) {
  const rows = await db.query.integrations.findMany({
    where: eq(integrations.organizationId, organizationId),
    columns: {
      id: true,
      customDomain: true,
    },
  });

  await Promise.all(
    rows
      .filter((row) => row.customDomain)
      .map((row) =>
        removeCustomDomain(row.customDomain!).catch(() => undefined),
      ),
  );

  if (rows.length === 0) {
    return;
  }

  await db
    .update(integrations)
    .set({
      customDomain: null,
      customDomainStatus: "none",
      customDomainAddedAt: null,
      customDomainVerifiedAt: null,
    })
    .where(eq(integrations.organizationId, organizationId));
}
