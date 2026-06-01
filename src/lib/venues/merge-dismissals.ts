import { db } from "@/db";
import { venueMergeDismissals } from "@/db/schema";

export function canonicalVenuePairIds(idA: string, idB: string): [string, string] {
  return idA < idB ? [idA, idB] : [idB, idA];
}

export function venuePairDismissalKey(idA: string, idB: string) {
  const [venueIdA, venueIdB] = canonicalVenuePairIds(idA, idB);
  return `${venueIdA}:${venueIdB}`;
}

export function isVenuePairDismissed(
  dismissedKeys: ReadonlySet<string>,
  idA: string,
  idB: string,
) {
  return dismissedKeys.has(venuePairDismissalKey(idA, idB));
}

export async function loadDismissedVenuePairKeys(): Promise<Set<string>> {
  const rows = await db.query.venueMergeDismissals.findMany({
    columns: { venueIdA: true, venueIdB: true },
  });

  return new Set(
    rows.map((row) => venuePairDismissalKey(row.venueIdA, row.venueIdB)),
  );
}

export function allPairsFromVenueIds(venueIds: string[]) {
  const pairs: Array<[string, string]> = [];

  for (let index = 0; index < venueIds.length; index += 1) {
    for (let other = index + 1; other < venueIds.length; other += 1) {
      const left = venueIds[index]!;
      const right = venueIds[other]!;
      if (left !== right) {
        pairs.push(canonicalVenuePairIds(left, right));
      }
    }
  }

  return pairs;
}

export async function dismissVenueMergePairs(venueIds: string[]) {
  const uniqueIds = [...new Set(venueIds)];
  const pairs = allPairsFromVenueIds(uniqueIds);

  if (pairs.length === 0) {
    return { dismissed: 0 };
  }

  const values = pairs.map(([venueIdA, venueIdB]) => ({
    venueIdA,
    venueIdB,
  }));

  await db
    .insert(venueMergeDismissals)
    .values(values)
    .onConflictDoNothing();

  return { dismissed: pairs.length };
}
