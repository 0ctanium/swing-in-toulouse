import { and, asc, count, eq, isNull, ne, sql } from "drizzle-orm";

import { db } from "@/db";
import { events, organizations, sources, venues } from "@/db/schema";
import type { OrganizationCategory } from "@/db/schema";
import { generateOrganizationSlug } from "@/lib/slug";

export type AdminOrganizationRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  website: string | null;
  category: OrganizationCategory | null;
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
  const [organizationRows, sourceCountRows, eventCountRows] = await Promise.all([
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
    db
      .select({
        organizationId: events.organizationId,
        value: count(),
      })
      .from(events)
      .where(sql`${events.organizationId} is not null`)
      .groupBy(events.organizationId),
  ]);

  const sourceCounts = new Map(
    sourceCountRows.map((row) => [row.organizationId!, Number(row.value)]),
  );
  const eventCounts = new Map(
    eventCountRows.map((row) => [row.organizationId!, Number(row.value)]),
  );

  return organizationRows.map((organization) => ({
    id: organization.id,
    slug: organization.slug,
    name: organization.name,
    description: organization.description,
    website: organization.website,
    category: organization.category,
    venueId: organization.venueId,
    venueName: organization.venue?.name ?? null,
    venueSlug: organization.venue?.slug ?? null,
    isActive: organization.isActive,
    sourceCount: sourceCounts.get(organization.id) ?? 0,
    eventCount: eventCounts.get(organization.id) ?? 0,
  }));
}
