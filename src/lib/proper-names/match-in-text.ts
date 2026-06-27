import { namesSimilar, normalizeLabel } from "@/lib/venues/normalize";

export type ProperNameMatchKind = "exact" | "partial";

export type NamedEntityCandidate = {
  id: string;
  names: readonly string[];
};

export type NamedEntityMatch = {
  id: string;
  kind: ProperNameMatchKind;
  matchedNameLength: number;
};

const MATCH_PRIORITY: Record<ProperNameMatchKind, number> = {
  exact: 0,
  partial: 1,
};

const LEADING_ARTICLE_RE = /^(?:l|le|la|les|un|une|des)\s+/u;

function withoutLeadingArticle(normalized: string) {
  return normalized.replace(LEADING_ARTICLE_RE, "").trim();
}

function nameVariants(normalizedName: string) {
  const variants = [normalizedName];
  const withoutArticle = withoutLeadingArticle(normalizedName);

  if (withoutArticle && withoutArticle !== normalizedName) {
    variants.push(withoutArticle);
  }

  return variants;
}

function paddedHaystack(text: string) {
  const normalized = normalizeLabel(text);
  return normalized ? ` ${normalized} ` : "";
}

/** Match a single proper name against free text (no plural folding). */
export function matchProperNameInText(
  text: string,
  name: string,
): ProperNameMatchKind | null {
  const haystack = paddedHaystack(text);
  if (!haystack) {
    return null;
  }

  const normalizedName = normalizeLabel(name);
  if (!normalizedName) {
    return null;
  }

  for (const variant of nameVariants(normalizedName)) {
    if (variant.length >= 3 && haystack.includes(` ${variant} `)) {
      return "exact";
    }
  }

  const flatHaystack = haystack.trim();
  for (const variant of nameVariants(normalizedName)) {
    if (namesSimilar(variant, flatHaystack)) {
      return "partial";
    }
  }

  return null;
}

function compareNamedEntityMatch(
  left: NamedEntityMatch,
  right: NamedEntityMatch,
) {
  const kindDelta = MATCH_PRIORITY[left.kind] - MATCH_PRIORITY[right.kind];
  if (kindDelta !== 0) {
    return kindDelta;
  }

  return right.matchedNameLength - left.matchedNameLength;
}

export function findNamedEntityMatchesInText(
  text: string,
  candidates: readonly NamedEntityCandidate[],
): NamedEntityMatch[] {
  if (!text.trim() || candidates.length === 0) {
    return [];
  }

  const matches: NamedEntityMatch[] = [];

  for (const candidate of candidates) {
    let bestKind: ProperNameMatchKind | null = null;
    let bestNameLength = 0;

    for (const name of candidate.names) {
      const kind = matchProperNameInText(text, name);
      if (!kind) {
        continue;
      }

      const nameLength = normalizeLabel(name).length;
      const kindPriority = MATCH_PRIORITY[kind];
      const bestKindPriority = bestKind ? MATCH_PRIORITY[bestKind] : Infinity;

      if (
        kindPriority < bestKindPriority ||
        (kindPriority === bestKindPriority && nameLength > bestNameLength)
      ) {
        bestKind = kind;
        bestNameLength = nameLength;
      }
    }

    if (bestKind) {
      matches.push({
        id: candidate.id,
        kind: bestKind,
        matchedNameLength: bestNameLength,
      });
    }
  }

  return matches.sort(compareNamedEntityMatch);
}

export type NamedEntitySuggestion = {
  id: string;
  label: string;
  kind: ProperNameMatchKind;
};

export function suggestNamedEntitiesFromText({
  title,
  description,
  candidates,
  labelsById,
  selectedId,
  limit = 3,
}: {
  title?: string | null;
  description?: string | null;
  candidates: readonly NamedEntityCandidate[];
  labelsById: ReadonlyMap<string, string>;
  selectedId?: string | null;
  limit?: number;
}): NamedEntitySuggestion[] {
  const text = [title ?? "", description ?? ""].filter(Boolean).join(" ");
  if (!text.trim()) {
    return [];
  }

  const suggestions: NamedEntitySuggestion[] = [];
  const seen = new Set<string>();

  for (const match of findNamedEntityMatchesInText(text, candidates)) {
    if (match.id === selectedId || seen.has(match.id)) {
      continue;
    }

    const label = labelsById.get(match.id);
    if (!label) {
      continue;
    }

    seen.add(match.id);
    suggestions.push({
      id: match.id,
      label,
      kind: match.kind,
    });

    if (suggestions.length >= limit) {
      break;
    }
  }

  return suggestions;
}
