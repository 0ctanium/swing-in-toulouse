import { eq, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  eventCategoryTags,
  type EventCategoryTag,
  type EventCategoryTagType,
} from "@/db/schema";
import { collectDistinctEventCategoryTagNames } from "@/lib/event-category-tags/collect";
import { DEFAULT_EVENT_CATEGORY_TAG_TYPE } from "@/lib/event-category-tags/tag-types";
import type { UpdateCategoryTagInput } from "@/lib/event-category-tags/schemas";
import { isPublishableTagType } from "@/lib/event-category-tags/publishable";
import { isTimePresetSlug } from "@/lib/event-collections/time-presets";

export const ADMIN_CATEGORY_TAGS_PAGE_SIZE = 20;

export type AdminCategoryTagRow = {
  name: string;
  tagType: EventCategoryTagType;
  hasMetadata: boolean;
  slug: string | null;
  subtitle: string | null;
  description: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  heroTitleBefore: string | null;
  heroTitleEmphasis: string | null;
  heroTitleAfter: string | null;
  isPublished: boolean;
};

export type AdminCategoryTagsListResult = {
  rows: AdminCategoryTagRow[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  search: string;
};

function preservePublishedState(
  tagType: EventCategoryTagType,
  existing: EventCategoryTag | undefined,
) {
  return isPublishableTagType(tagType) ? (existing?.isPublished ?? false) : false;
}

function assertPublishableSlug(
  tagType: EventCategoryTagType,
  slug: string | null,
  isPublished: boolean,
) {
  if (!isPublished) {
    return;
  }

  if (!slug) {
    throw new Error("Un slug est requis pour publier la page.");
  }

  if (isTimePresetSlug(slug)) {
    throw new Error("Ce slug est réservé à une page période.");
  }

  if (!isPublishableTagType(tagType)) {
    throw new Error(
      "Seuls les tags de type Danse ou Événement peuvent être publiés.",
    );
  }
}

function matchesSearch(name: string, search: string) {
  if (!search) {
    return true;
  }

  return name.toLocaleLowerCase("fr").includes(search.toLocaleLowerCase("fr"));
}

async function loadCategoryTagRowsByName() {
  const rows = await db.query.eventCategoryTags.findMany();
  return new Map(rows.map((row) => [row.name, row]));
}

export async function listAdminCategoryTags(options: {
  page?: number;
  pageSize?: number;
  search?: string;
}): Promise<AdminCategoryTagsListResult> {
  const pageSize = options.pageSize ?? ADMIN_CATEGORY_TAGS_PAGE_SIZE;
  const page = Math.max(1, options.page ?? 1);
  const search = options.search?.trim() ?? "";

  const [allNames, tagRowsByName] = await Promise.all([
    collectDistinctEventCategoryTagNames(),
    loadCategoryTagRowsByName(),
  ]);

  const filtered = allNames.filter((name) => matchesSearch(name, search));

  const rows: AdminCategoryTagRow[] = filtered.map((name) => {
    const metadata = tagRowsByName.get(name);

    return {
      name,
      tagType: metadata?.tagType ?? DEFAULT_EVENT_CATEGORY_TAG_TYPE,
      hasMetadata: metadata !== undefined,
      slug: metadata?.slug ?? null,
      subtitle: metadata?.subtitle ?? null,
      description: metadata?.description ?? null,
      seoTitle: metadata?.seoTitle ?? null,
      seoDescription: metadata?.seoDescription ?? null,
      heroTitleBefore: metadata?.heroTitleBefore ?? null,
      heroTitleEmphasis: metadata?.heroTitleEmphasis ?? null,
      heroTitleAfter: metadata?.heroTitleAfter ?? null,
      isPublished: metadata?.isPublished ?? false,
    };
  });

  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const slice = rows.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  return {
    rows: slice,
    page: currentPage,
    pageSize,
    total,
    totalPages,
    search,
  };
}

export async function upsertCategoryTagMetadata(
  name: string,
  tagType: EventCategoryTagType,
) {
  const trimmed = name.trim();

  if (!trimmed) {
    throw new Error("Nom de tag invalide.");
  }

  const existing = await db.query.eventCategoryTags.findFirst({
    where: eq(eventCategoryTags.name, trimmed),
  });

  const effectiveTagType = tagType;
  const isPublished = preservePublishedState(effectiveTagType, existing);

  const [row] = await db
    .insert(eventCategoryTags)
    .values({
      name: trimmed,
      tagType: effectiveTagType,
      isPublished,
    })
    .onConflictDoUpdate({
      target: eventCategoryTags.name,
      set: {
        tagType: effectiveTagType,
        isPublished,
        updatedAt: sql`now()`,
      },
    })
    .returning();

  return row;
}

function resolveUpdateFields(
  existing: EventCategoryTag | undefined,
  input: UpdateCategoryTagInput,
) {
  const tagType = input.tagType ?? existing?.tagType ?? DEFAULT_EVENT_CATEGORY_TAG_TYPE;
  const slug = input.slug !== undefined ? input.slug : (existing?.slug ?? null);
  const isPublished = isPublishableTagType(tagType)
    ? (input.isPublished ?? existing?.isPublished ?? false)
    : false;

  assertPublishableSlug(tagType, slug, isPublished);

  return {
    tagType,
    slug,
    subtitle:
      input.subtitle !== undefined
        ? input.subtitle
        : (existing?.subtitle ?? null),
    description:
      input.description !== undefined
        ? input.description
        : (existing?.description ?? null),
    seoTitle:
      input.seoTitle !== undefined ? input.seoTitle : (existing?.seoTitle ?? null),
    seoDescription:
      input.seoDescription !== undefined
        ? input.seoDescription
        : (existing?.seoDescription ?? null),
    heroTitleBefore:
      input.heroTitleBefore !== undefined
        ? input.heroTitleBefore
        : (existing?.heroTitleBefore ?? null),
    heroTitleEmphasis:
      input.heroTitleEmphasis !== undefined
        ? input.heroTitleEmphasis
        : (existing?.heroTitleEmphasis ?? null),
    heroTitleAfter:
      input.heroTitleAfter !== undefined
        ? input.heroTitleAfter
        : (existing?.heroTitleAfter ?? null),
    isPublished,
  };
}

export async function updateCategoryTag(name: string, input: UpdateCategoryTagInput) {
  const trimmed = name.trim();

  if (!trimmed) {
    throw new Error("Nom de tag invalide.");
  }

  const existing = await db.query.eventCategoryTags.findFirst({
    where: eq(eventCategoryTags.name, trimmed),
  });

  const fields = resolveUpdateFields(existing, input);

  const [row] = await db
    .insert(eventCategoryTags)
    .values({
      name: trimmed,
      ...fields,
    })
    .onConflictDoUpdate({
      target: eventCategoryTags.name,
      set: {
        ...fields,
        updatedAt: sql`now()`,
      },
    })
    .returning();

  return row;
}
