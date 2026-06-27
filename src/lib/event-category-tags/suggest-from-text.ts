import type { CategoryTagAliasesByTag } from "@/lib/event-category-tags/aliases";

export type TagSuggestionMatchKind =
  | "exact"
  | "configured"
  | "flexible"
  | "alias";

export type TagSuggestionMatch = {
  tag: string;
  kind: TagSuggestionMatchKind;
};

const MATCH_PRIORITY: Record<TagSuggestionMatchKind, number> = {
  exact: 0,
  configured: 1,
  flexible: 2,
  alias: 3,
};

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Lowercase, strip accents, unify punctuation for loose text matching. */
export function normalizeTextForTagMatching(text: string) {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[''’]/g, " ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function paddedHaystack(text: string) {
  const normalized = normalizeTextForTagMatching(text);
  return normalized ? ` ${normalized} ` : "";
}

function wordPluralPattern(word: string) {
  const escaped = escapeRegex(word);

  if (word.endsWith("s") && word.length > 3) {
    return `(?:${escapeRegex(word.slice(0, -1))}s?)`;
  }

  return `(?:${escaped}s?)`;
}

function matchesPhrase(
  haystack: string,
  phrase: string,
  flexible: boolean,
) {
  const words = phrase.split(" ").filter(Boolean);
  if (words.length === 0) {
    return false;
  }

  const parts = words.map((word) =>
    flexible ? wordPluralPattern(word) : escapeRegex(word),
  );
  const pattern = new RegExp(`(?:^|\\s)${parts.join("\\s+")}(?:\\s|$)`, "u");

  return pattern.test(haystack);
}

function buildUniqueFirstWordAliases(tags: readonly string[]) {
  const firstWordCounts = new Map<string, number>();

  for (const tag of tags) {
    const [firstWord] = normalizeTextForTagMatching(tag).split(" ");
    if (!firstWord) {
      continue;
    }
    firstWordCounts.set(firstWord, (firstWordCounts.get(firstWord) ?? 0) + 1);
  }

  const aliases = new Map<string, string>();

  for (const tag of tags) {
    const words = normalizeTextForTagMatching(tag).split(" ").filter(Boolean);
    if (words.length < 2) {
      continue;
    }

    const [firstWord] = words;
    if (firstWord.length < 4) {
      continue;
    }

    if (firstWordCounts.get(firstWord) !== 1) {
      continue;
    }

    aliases.set(firstWord, tag);
  }

  return aliases;
}

/** Skip alias hits when the word belongs to another matching multi-word tag (e.g. "jazz" in "solo jazz"). */
function isAliasWordUsedInAnotherMatchingTag(
  haystack: string,
  aliasWord: string,
  currentTag: string,
  candidateTags: readonly string[],
  aliasesByTag: CategoryTagAliasesByTag = {},
) {
  for (const tag of candidateTags) {
    if (tag === currentTag) {
      continue;
    }

    const words = normalizeTextForTagMatching(tag).split(" ").filter(Boolean);
    if (words.length < 2 || !words.slice(1).includes(aliasWord)) {
      continue;
    }

    const normalizedTag = words.join(" ");
    if (
      matchesPhrase(haystack, normalizedTag, false) ||
      matchesPhrase(haystack, normalizedTag, true)
    ) {
      return true;
    }
  }

  for (const [tag, configuredAliases] of Object.entries(aliasesByTag)) {
    if (tag === currentTag) {
      continue;
    }

    for (const alias of configuredAliases) {
      const normalizedAlias = normalizeTextForTagMatching(alias);
      const aliasWords = normalizedAlias.split(" ").filter(Boolean);

      if (!aliasWords.includes(aliasWord)) {
        continue;
      }

      if (matchesPhrase(haystack, normalizedAlias, true)) {
        return true;
      }
    }
  }

  return false;
}

function compareSuggestions(left: TagSuggestionMatch, right: TagSuggestionMatch) {
  const kindDelta = MATCH_PRIORITY[left.kind] - MATCH_PRIORITY[right.kind];
  if (kindDelta !== 0) {
    return kindDelta;
  }

  return right.tag.length - left.tag.length;
}

export function findCategoryTagMatchesInText(
  text: string,
  candidateTags: readonly string[],
  aliasesByTag: CategoryTagAliasesByTag = {},
): TagSuggestionMatch[] {
  const haystack = paddedHaystack(text);
  if (!haystack) {
    return [];
  }

  const heuristicAliases = buildUniqueFirstWordAliases(candidateTags);
  const matches: TagSuggestionMatch[] = [];

  for (const tag of candidateTags) {
    const normalizedTag = normalizeTextForTagMatching(tag);
    if (!normalizedTag) {
      continue;
    }

    if (matchesPhrase(haystack, normalizedTag, false)) {
      matches.push({ tag, kind: "exact" });
      continue;
    }

    const configuredAliases = aliasesByTag[tag] ?? [];
    const configuredMatch = configuredAliases.some((alias) =>
      matchesPhrase(haystack, normalizeTextForTagMatching(alias), true),
    );

    if (configuredMatch) {
      matches.push({ tag, kind: "configured" });
      continue;
    }

    if (matchesPhrase(haystack, normalizedTag, true)) {
      matches.push({ tag, kind: "flexible" });
      continue;
    }

    const words = normalizedTag.split(" ").filter(Boolean);
    const [firstWord] = words;
    if (words.length >= 2 && firstWord && heuristicAliases.get(firstWord) === tag) {
      if (
        matchesPhrase(haystack, firstWord, true) &&
        !isAliasWordUsedInAnotherMatchingTag(
          haystack,
          firstWord,
          tag,
          candidateTags,
          aliasesByTag,
        )
      ) {
        matches.push({ tag, kind: "alias" });
      }
    }
  }

  return matches.sort(compareSuggestions);
}

export function suggestCategoryTagsFromText({
  title,
  description,
  candidateTags,
  selectedTags = [],
  aliasesByTag = {},
}: {
  title?: string | null;
  description?: string | null;
  candidateTags: readonly string[];
  selectedTags?: readonly string[];
  aliasesByTag?: CategoryTagAliasesByTag;
}): string[] {
  const selected = new Set(selectedTags);
  const text = [title ?? "", description ?? ""].filter(Boolean).join(" ");

  if (!text.trim() || candidateTags.length === 0) {
    return [];
  }

  const seen = new Set<string>();
  const suggestions: string[] = [];

  for (const match of findCategoryTagMatchesInText(
    text,
    candidateTags,
    aliasesByTag,
  )) {
    if (selected.has(match.tag) || seen.has(match.tag)) {
      continue;
    }

    seen.add(match.tag);
    suggestions.push(match.tag);
  }

  return suggestions;
}
