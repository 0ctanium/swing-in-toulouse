import type { OverrideIndex } from "@/lib/events/overrides";

export type AdminEventMeta = {
  masterOverridden: boolean;
  occurrenceOverridden: boolean;
  overrideCount: number;
};

type OccurrenceRef = {
  id: string;
  masterEventId: string;
  startAt: Date;
};

export function buildAdminMetaForOccurrences(
  occurrences: OccurrenceRef[],
  overrides: OverrideIndex,
): Map<string, AdminEventMeta> {
  const metaByOccurrenceId = new Map<string, AdminEventMeta>();

  for (const occurrence of occurrences) {
    const masterId = occurrence.masterEventId;
    const masterOverride = overrides.master.get(masterId);
    const occurrenceOverride = overrides.occurrences
      .get(masterId)
      ?.get(occurrence.startAt.toISOString());

    const occurrenceCount = overrides.occurrences.get(masterId)?.size ?? 0;
    const overrideCount =
      (masterOverride ? 1 : 0) + occurrenceCount;

    metaByOccurrenceId.set(occurrence.id, {
      masterOverridden: Boolean(masterOverride),
      occurrenceOverridden: Boolean(occurrenceOverride),
      overrideCount,
    });
  }

  return metaByOccurrenceId;
}
