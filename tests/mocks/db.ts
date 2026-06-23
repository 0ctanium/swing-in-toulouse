import { drizzle } from "drizzle-orm/node-postgres";
import type { Mock } from "vitest";
import { vi } from "vitest";

import * as schema from "@/db/schema";

export type MockDb = ReturnType<typeof createMockDb>;

/**
 * In-memory Drizzle client for unit tests.
 *
 * Use when you only need to stub specific query results (e.g. auth scoping)
 * without running SQL. For workflows that need real queries, use
 * `createPgTestDb()` instead.
 */
export function createMockDb() {
  return drizzle.mock({ schema });
}

/**
 * Replace the app `db` singleton with a mock driver instance.
 * Returns the mock db and a restore function.
 */
export function mockDbModule(db: MockDb = createMockDb()) {
  vi.mock("@/db", () => ({
    db,
  }));

  return db;
}

/** Convenience: stub `db.query.<table>.findFirst` on a mock db. */
export function stubFindFirst<T>(
  findFirst: Mock,
  result: T | undefined,
) {
  findFirst.mockResolvedValue(result);
}
