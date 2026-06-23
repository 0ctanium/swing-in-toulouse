import { vi } from "vitest";

import type { PgTestDb } from "../helpers/pg-test-db";

const integrationDbState = vi.hoisted(() => ({
  current: null as PgTestDb | null,
}));

vi.mock("@/db", () => ({
  get db() {
    if (!integrationDbState.current) {
      throw new Error(
        "Integration DB is not initialized. Call setupIntegrationDb() in your test file.",
      );
    }

    return integrationDbState.current.db;
  },
}));

export { integrationDbState };
