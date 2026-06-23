import { and, asc, count, eq, isNull, ne } from "drizzle-orm";

import { type AdminDataScope } from "@/lib/admin/data-scope";
import { db } from "@/db";
import { events, organizations, sources, type SourceType } from "@/db/schema";

export type AdminSourceRow = {
  id: string;
  slug: string;
  name: string;
  type: SourceType;
  url: string | null;
  icalFileName: string | null;
  icalFileSize: number | null;
  icalUploadedAt: Date | null;
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

export async function getSourceById(sourceId: string) {
  return db.query.sources.findFirst({
    where: eq(sources.id, sourceId),
  });
}

export async function listAdminSources(
  scope: AdminDataScope,
): Promise<AdminSourceRow[]> {
  const [sourceRows, eventCountRows] = await Promise.all([
    db.query.sources.findMany({
      where:
        scope.mode === "org"
          ? eq(sources.organizationId, scope.organizationId)
          : undefined,
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
      .where(isNull(events.canonicalEventId))
      .groupBy(events.sourceId),
  ]);

  const eventCounts = new Map(
    eventCountRows.map((row) => [row.sourceId, Number(row.value)]),
  );

  return sourceRows.map((source) => ({
    id: source.id,
    slug: source.slug,
    name: source.name,
    type: source.type,
    url: source.url,
    icalFileName: source.icalFileName,
    icalFileSize: source.icalFileSize,
    icalUploadedAt: source.icalUploadedAt,
    isActive: source.isActive,
    organizationId: source.organizationId,
    organizationName: source.organization?.name ?? null,
    organizationSlug: source.organization?.slug ?? null,
    defaultLocationRaw: source.defaultLocationRaw,
    defaultCategories: source.defaultCategories,
    eventCount: eventCounts.get(source.id) ?? 0,
  }));
}
