/**
 * Shared integration DB lifecycle — one PGLite instance + schema push per worker.
 */
import { afterAll, beforeAll } from "vitest";

import {
  setupIntegrationDb,
  teardownIntegrationDb,
} from "../helpers/setup-integration-db";

beforeAll(async () => {
  process.env.DATABASE_DRIVER = "node-postgres";
  await setupIntegrationDb();
}, 60_000);

afterAll(async () => {
  await teardownIntegrationDb();
}, 60_000);
