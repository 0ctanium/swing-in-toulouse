import { and, eq, isNull } from "drizzle-orm";

import { db } from "@/db";
import { organizations, sources } from "@/db/schema";
import { resolveUniqueSourceSlug } from "@/lib/sources/admin";

export async function getOrCreateManualSource(organizationId: string | null) {
  const existing = await db.query.sources.findFirst({
    where: and(
      eq(sources.type, "manual"),
      organizationId
        ? eq(sources.organizationId, organizationId)
        : isNull(sources.organizationId),
    ),
  });

  if (existing) {
    return existing;
  }

  let name = "Événements manuels";
  let baseSlug = "manual";

  if (organizationId) {
    const organization = await db.query.organizations.findFirst({
      where: eq(organizations.id, organizationId),
    });

    if (!organization) {
      throw new Error("Organisateur introuvable.");
    }

    name = `Événements manuels — ${organization.name}`;
    baseSlug = `manual-${organization.slug}`;
  }

  const slug = await resolveUniqueSourceSlug(baseSlug);
  const [created] = await db
    .insert(sources)
    .values({
      name,
      slug,
      type: "manual",
      organizationId,
      isActive: true,
    })
    .returning();

  return created;
}
