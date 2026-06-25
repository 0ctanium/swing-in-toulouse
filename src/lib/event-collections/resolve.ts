import { getTimePresetCollection, getTimePresetCollectionMeta } from "@/lib/event-collections/time-presets";
import { getPublishedTagCollectionUncached } from "@/lib/event-collections/tag-pages";
import type { EventCollection } from "@/lib/event-collections/types";

export async function resolveEvenementsCollectionMeta(
  slug: string,
): Promise<EventCollection | null> {
  const timePreset = getTimePresetCollectionMeta(slug);

  if (timePreset) {
    return timePreset;
  }

  return getPublishedTagCollectionUncached(slug, "evenement");
}

export async function resolveEvenementsCollectionSlug(
  slug: string,
): Promise<EventCollection | null> {
  const timePreset = getTimePresetCollection(slug);

  if (timePreset) {
    return timePreset;
  }

  return getPublishedTagCollectionUncached(slug, "evenement");
}
