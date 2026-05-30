import { and, asc, count, eq, ne, sql } from "drizzle-orm";

import { db } from "@/db";
import { events, organizations, sources } from "@/db/schema";

export type AdminSourceRow = {
  id: string;
  slug: string;
  name: string;
  url: string;
  isActive: boolean;
  organizationId: string | null;
  organizationName: string | null;
  organizationSlug: string | null;
  defaultLocationRaw: string | null;
  defaultCategories: string[] | null;
  eventCount: number;
};

export async function resolveUniqueSourceSlug(
  baseSlug: string,
  excludeId?: string,
) {
  let candidate = baseSlug;
  let suffix = 2;

  while (true) {
    const existing = await db.query.sources.findFirst({
      where: excludeId
        ? and(eq(sources.slug, candidate), ne(sources.id, excludeId))
        : eq(sources.slug, candidate),
      columns: { id: true },
    });

    if (!existing) {
      return candidate;
    }

    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}

export async function getOrganizationById(organizationId: string) {
  return db.query.organizations.findFirst({
    where: eq(organizations.id, organizationId),
    columns: { id: true },
  });
}

export async function listAdminSources(): Promise<AdminSourceRow[]> {
  const [sourceRows, eventCountRows] = await Promise.all([
    db.query.sources.findMany({
      orderBy: asc(sources.name),
      with: {
        organization: {
          columns: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    }),
    db
      .select({
        sourceId: events.sourceId,
        value: count(),
      })
      .from(events)
      .groupBy(events.sourceId),
  ]);

  const eventCounts = new Map(
    eventCountRows.map((row) => [row.sourceId, Number(row.value)]),
  );

  return sourceRows.map((source) => ({
    id: source.id,
    slug: source.slug,
    name: source.name,
    url: source.url,
    isActive: source.isActive,
    organizationId: source.organizationId,
    organizationName: source.organization?.name ?? null,
    organizationSlug: source.organization?.slug ?? null,
    defaultLocationRaw: source.defaultLocationRaw,
    defaultCategories: source.defaultCategories,
    eventCount: eventCounts.get(source.id) ?? 0,
  }));
}
