import {
  isHeroTitleCustomized,
  type DanceHeroTitleFields,
  type ResolvedHeroTitle,
} from "@/lib/event-category-tags/hero-title";
import type { EventCollection, PublishableTagType } from "@/lib/event-collections/types";

const DEFAULT_EVENT_TAG_HERO_BEFORE = "";
const DEFAULT_EVENT_TAG_HERO_AFTER = "swing à Toulouse";

export function collectionPageTitle(
  collection: Pick<EventCollection, "label" | "seoTitle" | "tagType" | "kind"> &
    Partial<DanceHeroTitleFields>,
) {
  return collection.seoTitle ?? formatCollectionHeroTitlePlain(collection);
}

export function collectionPageDescription(
  collection: Pick<EventCollection, "label" | "seoDescription" | "description" | "kind" | "tagType">,
) {
  if (collection.seoDescription) {
    return collection.seoDescription;
  }

  if (collection.description) {
    return collection.description;
  }

  if (collection.kind === "time-preset") {
    return `Agenda des événements swing à Toulouse : ${collection.label.toLowerCase()}.`;
  }

  if (collection.tagType === "evenement") {
    return `Festivals, stages et rendez-vous ${collection.label.toLowerCase()} du swing à Toulouse et en Occitanie.`;
  }

  return `Soirées, cours et stages de ${collection.label} à Toulouse et en Occitanie.`;
}

export function defaultHeroTitleForTag(
  tagType: PublishableTagType,
  name: string,
): DanceHeroTitleFields {
  if (tagType === "danse") {
    return {
      heroTitleBefore: "Où danser le",
      heroTitleEmphasis: name,
      heroTitleAfter: "à Toulouse ?",
    };
  }

  return {
    heroTitleBefore: DEFAULT_EVENT_TAG_HERO_BEFORE,
    heroTitleEmphasis: name,
    heroTitleAfter: DEFAULT_EVENT_TAG_HERO_AFTER,
  };
}

export function formatCollectionHeroTitlePlain(
  collection: Pick<EventCollection, "label" | "tagType" | "kind"> &
    Partial<DanceHeroTitleFields>,
) {
  const hero = resolveCollectionHeroTitle(collection);
  return [hero.before, hero.emphasis, hero.after].filter(Boolean).join(" ");
}

export function resolveCollectionHeroTitle(
  collection: Pick<EventCollection, "label" | "tagType" | "kind"> &
    Partial<DanceHeroTitleFields>,
): ResolvedHeroTitle {
  const defaults =
    collection.kind === "tag" && collection.tagType
      ? defaultHeroTitleForTag(collection.tagType, collection.label)
      : {
          heroTitleBefore: "",
          heroTitleEmphasis: collection.label,
          heroTitleAfter: "",
        };

  const fields = {
    heroTitleBefore: collection.heroTitleBefore,
    heroTitleEmphasis: collection.heroTitleEmphasis,
    heroTitleAfter: collection.heroTitleAfter,
  };

  if (!isHeroTitleCustomized(fields)) {
    return {
      before: defaults.heroTitleBefore ?? "",
      emphasis: defaults.heroTitleEmphasis ?? collection.label,
      after: defaults.heroTitleAfter ?? "",
    };
  }

  return {
    before: fields.heroTitleBefore ?? "",
    emphasis: fields.heroTitleEmphasis ?? collection.label,
    after: fields.heroTitleAfter ?? "",
  };
}
