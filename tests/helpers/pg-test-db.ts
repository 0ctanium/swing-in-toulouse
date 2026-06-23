import { PGlite } from "@electric-sql/pglite";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { createRequire } from "node:module";

import * as schema from "@/db/schema";

const require = createRequire(import.meta.url);

export type PgTestDb = Awaited<ReturnType<typeof createPgTestDb>>;

const TRUNCATE_TABLES = [
  "event_overrides",
  "sync_logs",
  "events",
  "sources",
  "venue_merge_dismissals",
  "organizations",
  "event_category_tags",
  "venues",
] as const;

/**
 * Real in-memory Postgres (PGLite) for integration tests.
 *
 * Current schema defaults use `gen_random_uuid()`, which PGLite supports
 * without installing extensions. PGLite does **not** ship optional extensions
 * such as `uuidv7` — if the production schema starts depending on them,
 * integration tests will need a different DB strategy (e.g. dockerized Neon).
 */
export async function createPgTestDb() {
  const client = new PGlite();
  const db = drizzle({ client, schema });

  const { pushSchema } = require("drizzle-kit/api") as typeof import(
    "drizzle-kit/api"
  );
  const { apply } = await pushSchema(schema, db as never);
  await apply();

  return { db, client };
}

export async function resetPgTestDb(testDb: PgTestDb) {
  const tableList = TRUNCATE_TABLES.map((table) => `"${table}"`).join(", ");
  await testDb.db.execute(
    sql.raw(`TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE`),
  );
}

export async function closePgTestDb(testDb: PgTestDb) {
  await testDb.client.close();
}

/** Returns false when an extension is unavailable or unsupported in PGLite. */
export async function probePgExtension(
  client: PGlite,
  extension: string,
  timeoutMs = 2_000,
): Promise<boolean> {
  try {
    await Promise.race([
      client.exec(`CREATE EXTENSION IF NOT EXISTS "${extension}"`),
      new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error(`Extension probe timed out: ${extension}`)),
          timeoutMs,
        );
      }),
    ]);
    return true;
  } catch {
    return false;
  }
}
