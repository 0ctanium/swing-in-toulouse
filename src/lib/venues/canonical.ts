import { eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import { venues, type Venue } from "@/db/schema";

export class VenueCanonicalError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VenueCanonicalError";
  }
}

export type VenueRedirectEntry = {
  aliasId: string;
  aliasSlug: string;
  aliasName: string;
  canonicalId: string;
  canonicalSlug: string;
  canonicalName: string;
  eventCount: number;
};

export function buildVenueCanonicalMap(venueRows: Pick<Venue, "id" | "canonicalVenueId">[]) {
  const byId = new Map(venueRows.map((row) => [row.id, row.canonicalVenueId]));

  function resolve(venueId: string): string {
    let currentId = venueId;
    const visited = new Set<string>();

    for (let depth = 0; depth < 16; depth += 1) {
      if (visited.has(currentId)) {
        throw new VenueCanonicalError("Redirection de lieu circulaire détectée.");
      }

      visited.add(currentId);
      const parentId = byId.get(currentId);
      if (!parentId) {
        return currentId;
      }

      currentId = parentId;
    }

    throw new VenueCanonicalError("Chaîne de redirections de lieu trop profonde.");
  }

  return { resolve, byId };
}

export async function loadVenueCanonicalMap() {
  const rows = await db.query.venues.findMany({
    columns: { id: true, canonicalVenueId: true },
  });

  return buildVenueCanonicalMap(rows);
}

export function resolveCanonicalVenueId(
  venueId: string,
  map: ReturnType<typeof buildVenueCanonicalMap>,
) {
  return map.resolve(venueId);
}

export async function resolveRootCanonicalVenueId(venueId: string) {
  const map = await loadVenueCanonicalMap();
  return map.resolve(venueId);
}

export async function resolveVenueForSync(venue: Venue) {
  const canonicalId = await resolveRootCanonicalVenueId(venue.id);

  if (canonicalId === venue.id) {
    return venue;
  }

  const canonical = await db.query.venues.findFirst({
    where: eq(venues.id, canonicalId),
  });

  return canonical ?? venue;
}

export type VenueSlugResolution =
  | { kind: "venue"; venue: Venue }
  | { kind: "redirect"; targetSlug: string };

export async function resolveVenueBySlug(slug: string): Promise<VenueSlugResolution | null> {
  const venue = await db.query.venues.findFirst({
    where: eq(venues.slug, slug),
  });

  if (!venue) {
    return null;
  }

  if (venue.canonicalVenueId) {
    const canonical = await db.query.venues.findFirst({
      where: eq(venues.id, venue.canonicalVenueId),
    });

    if (canonical) {
      return { kind: "redirect", targetSlug: canonical.slug };
    }
  }

  return { kind: "venue", venue };
}

export async function listVenueRedirects(): Promise<VenueRedirectEntry[]> {
  const aliasRows = await db.query.venues.findMany({
    where: (table, { isNotNull }) => isNotNull(table.canonicalVenueId),
    columns: {
      id: true,
      slug: true,
      name: true,
      canonicalVenueId: true,
    },
    with: {
      canonicalVenue: {
        columns: { id: true, slug: true, name: true },
      },
    },
    orderBy: (table, { asc }) => [asc(table.name)],
  });

  return aliasRows
    .filter((row) => row.canonicalVenue)
    .map((row) => ({
      aliasId: row.id,
      aliasSlug: row.slug,
      aliasName: row.name,
      canonicalId: row.canonicalVenue!.id,
      canonicalSlug: row.canonicalVenue!.slug,
      canonicalName: row.canonicalVenue!.name,
      eventCount: 0,
    }));
}

async function assertValidAliasTarget(targetVenueId: string) {
  const target = await db.query.venues.findFirst({
    where: eq(venues.id, targetVenueId),
    columns: { id: true, name: true, canonicalVenueId: true },
  });

  if (!target) {
    throw new VenueCanonicalError("Lieu cible introuvable.");
  }

  if (target.canonicalVenueId) {
    throw new VenueCanonicalError(
      "Le lieu cible est déjà un alias. Choisissez le lieu principal.",
    );
  }

  return target;
}

export async function setVenueAlias(sourceVenueId: string, targetVenueId: string) {
  if (sourceVenueId === targetVenueId) {
    throw new VenueCanonicalError("Un lieu ne peut pas être alias de lui-même.");
  }

  await assertValidAliasTarget(targetVenueId);

  const map = await loadVenueCanonicalMap();
  const rootTargetId = map.resolve(targetVenueId);

  if (sourceVenueId === rootTargetId) {
    throw new VenueCanonicalError("Un lieu principal ne peut pas devenir alias.");
  }

  const descendants = await db.query.venues.findMany({
    where: eq(venues.canonicalVenueId, sourceVenueId),
    columns: { id: true },
  });

  await db
    .update(venues)
    .set({ canonicalVenueId: rootTargetId })
    .where(eq(venues.id, sourceVenueId));

  if (descendants.length > 0) {
    await db
      .update(venues)
      .set({ canonicalVenueId: rootTargetId })
      .where(
        inArray(
          venues.id,
          descendants.map((row) => row.id),
        ),
      );
  }
}

export async function clearVenueAlias(sourceVenueId: string) {
  await db
    .update(venues)
    .set({ canonicalVenueId: null })
    .where(eq(venues.id, sourceVenueId));
}

export async function applyPermanentVenueAliases(
  targetVenueId: string,
  sourceVenueIds: string[],
) {
  const rootTargetId = await resolveRootCanonicalVenueId(targetVenueId);
  await assertValidAliasTarget(rootTargetId);

  for (const sourceVenueId of sourceVenueIds) {
    if (sourceVenueId === rootTargetId) {
      continue;
    }

    await setVenueAlias(sourceVenueId, rootTargetId);
  }
}
