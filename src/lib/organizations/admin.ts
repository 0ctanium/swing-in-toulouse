import { and, asc, count, eq, isNull, ne, sql } from "drizzle-orm";

import { db } from "@/db";
import { organizations, sources, venues } from "@/db/schema";
import type { OrganizationCategory } from "@/db/schema";
import type { OrganizationDance } from "@/lib/organizations/dances";
import type { OrganizationSocialLinks } from "@/lib/organizations/social-links";
import { computeEffectiveOrganizationEventCounts } from "@/lib/organizations/effective-organization";
import { generateOrganizationSlug } from "@/lib/slug";

export type AdminOrganizationRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  website: string | null;
  category: OrganizationCategory | null;
  dances: OrganizationDance[] | null;
  socialLinks: OrganizationSocialLinks | null;
  venueId: string | null;
  venueName: string | null;
  venueSlug: string | null;
  isActive: boolean;
  sourceCount: number;
  eventCount: number;
};

export async function getSelectableVenueById(venueId: string) {
  return db.query.venues.findFirst({
    where: and(eq(venues.id, venueId), isNull(venues.canonicalVenueId)),
  });
}

export async function resolveUniqueOrganizationSlug(
  baseSlug: string,
  excludeId?: string,
) {
  let candidate = baseSlug;
  let suffix = 2;

  while (true) {
    const existing = await db.query.organizations.findFirst({
      where: excludeId
        ? and(
            eq(organizations.slug, candidate),
            ne(organizations.id, excludeId),
          )
        : eq(organizations.slug, candidate),
      columns: { id: true },
    });

    if (!existing) {
      return candidate;
    }

    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}

export async function listAdminOrganizations(): Promise<AdminOrganizationRow[]> {
  const [organizationRows, sourceCountRows, eventCounts] = await Promise.all([
    db.query.organizations.findMany({
      orderBy: asc(organizations.name),
      with: {
        venue: {
          columns: {
            name: true,
            slug: true,
          },
        },
      },
    }),
    db
      .select({
        organizationId: sources.organizationId,
        value: count(),
      })
      .from(sources)
      .where(sql`${sources.organizationId} is not null`)
      .groupBy(sources.organizationId),
    computeEffectiveOrganizationEventCounts(),
  ]);

  const sourceCounts = new Map(
    sourceCountRows.map((row) => [row.organizationId!, Number(row.value)]),
  );

  return organizationRows.map((organization) => ({
    id: organization.id,
    slug: organization.slug,
    name: organization.name,
    description: organization.description,
    website: organization.website,
    category: organization.category,
    dances: organization.dances ?? null,
    socialLinks: organization.socialLinks ?? null,
    venueId: organization.venueId,
    venueName: organization.venue?.name ?? null,
    venueSlug: organization.venue?.slug ?? null,
    isActive: organization.isActive,
    sourceCount: sourceCounts.get(organization.id) ?? 0,
    eventCount: eventCounts.get(organization.id) ?? 0,
  }));
}
