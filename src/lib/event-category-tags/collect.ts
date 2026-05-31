import { sql } from "drizzle-orm";

import { db } from "@/db";

type TagRow = { tag: string };

function normalizeTagName(value: string) {
  return value.trim();
}

/**
 * All distinct category strings used on events, sources, and overrides.
 */
export async function collectDistinctEventCategoryTagNames(): Promise<string[]> {
  const result = await db.execute<TagRow>(sql`
    SELECT DISTINCT tag
    FROM (
      SELECT unnest(categories) AS tag
      FROM events
      WHERE categories IS NOT NULL
      UNION
      SELECT unnest(default_categories) AS tag
      FROM sources
      WHERE default_categories IS NOT NULL
      UNION
      SELECT jsonb_array_elements_text(patch->'categories') AS tag
      FROM event_overrides
      WHERE patch ? 'categories'
        AND jsonb_typeof(patch->'categories') = 'array'
    ) AS all_tags
    WHERE trim(tag) <> ''
    ORDER BY tag ASC
  `);

  const names = new Set<string>();

  for (const row of result.rows) {
    const normalized = normalizeTagName(row.tag);
    if (normalized) {
      names.add(normalized);
    }
  }

  return [...names].sort((left, right) => left.localeCompare(right, "fr"));
}
