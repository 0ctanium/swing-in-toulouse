import { normalizeTextForTagMatching } from "@/lib/event-category-tags/suggest-from-text";

export const MAX_CATEGORY_TAG_ALIASES = 20;
export const MAX_CATEGORY_TAG_ALIAS_LENGTH = 80;

export type CategoryTagAliasesByTag = Record<string, string[]>;

export function normalizeCategoryTagAliasKey(value: string) {
  return normalizeTextForTagMatching(value);
}

export function normalizeCategoryTagAliases(
  aliases: readonly string[] | null | undefined,
) {
  if (!aliases?.length) {
    return [];
  }

  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const alias of aliases) {
    const trimmed = alias.trim();
    if (!trimmed) {
      continue;
    }

    const key = normalizeCategoryTagAliasKey(trimmed);
    if (!key || seen.has(key)) {
      continue;
    }

    seen.add(key);
    normalized.push(trimmed);

    if (normalized.length >= MAX_CATEGORY_TAG_ALIASES) {
      break;
    }
  }

  return normalized;
}

export function assertCategoryTagAliasesValid({
  tagName,
  aliases,
  canonicalTagNames,
  aliasesByOtherTags,
}: {
  tagName: string;
  aliases: readonly string[];
  canonicalTagNames: readonly string[];
  aliasesByOtherTags: CategoryTagAliasesByTag;
}) {
  const normalizedTagName = normalizeCategoryTagAliasKey(tagName);

  if (!normalizedTagName) {
    throw new Error("Nom de tag invalide.");
  }

  const canonicalKeys = new Map<string, string>();

  for (const name of canonicalTagNames) {
    const key = normalizeCategoryTagAliasKey(name);
    if (key) {
      canonicalKeys.set(key, name);
    }
  }

  const seen = new Set<string>();

  for (const alias of aliases) {
    const trimmed = alias.trim();

    if (!trimmed) {
      continue;
    }

    if (trimmed.length > MAX_CATEGORY_TAG_ALIAS_LENGTH) {
      throw new Error(
        `L'alias « ${trimmed.slice(0, 32)}… » dépasse ${MAX_CATEGORY_TAG_ALIAS_LENGTH} caractères.`,
      );
    }

    const key = normalizeCategoryTagAliasKey(trimmed);

    if (!key) {
      continue;
    }

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);

    if (key === normalizedTagName) {
      throw new Error(`« ${trimmed} » est déjà le nom du tag.`);
    }

    const canonicalOwner = canonicalKeys.get(key);
    if (canonicalOwner && canonicalOwner !== tagName) {
      throw new Error(`« ${trimmed} » est déjà un tag (${canonicalOwner}).`);
    }

    for (const [owner, ownerAliases] of Object.entries(aliasesByOtherTags)) {
      if (owner === tagName) {
        continue;
      }

      for (const existingAlias of ownerAliases) {
        if (normalizeCategoryTagAliasKey(existingAlias) === key) {
          throw new Error(`« ${trimmed} » est déjà un alias de « ${owner} ».`);
        }
      }
    }
  }

  if (aliases.length > MAX_CATEGORY_TAG_ALIASES) {
    throw new Error(
      `Un tag ne peut pas avoir plus de ${MAX_CATEGORY_TAG_ALIASES} alias.`,
    );
  }
}

export function buildCategoryTagAliasesByTag(
  rows: readonly { name: string; aliases: string[] | null | undefined }[],
): CategoryTagAliasesByTag {
  const map: CategoryTagAliasesByTag = {};

  for (const row of rows) {
    const aliases = normalizeCategoryTagAliases(row.aliases);
    if (aliases.length > 0) {
      map[row.name] = aliases;
    }
  }

  return map;
}
