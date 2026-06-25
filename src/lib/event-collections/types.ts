import type { EventCategoryTagType } from "@/db/schema";
import type { DanceHeroTitleFields } from "@/lib/event-category-tags/hero-title";

export type EventCollectionKind = "time-preset" | "tag";

export type PublishableTagType = Extract<EventCategoryTagType, "danse" | "evenement">;

export type EventCollectionFilters = {
  from?: Date;
  to?: Date;
  categoryName?: string;
};

export type EventCollection = {
  kind: EventCollectionKind;
  slug: string;
  path: string;
  label: string;
  tagType?: PublishableTagType;
  subtitle: string | null;
  description: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  filters: EventCollectionFilters;
} & DanceHeroTitleFields;
