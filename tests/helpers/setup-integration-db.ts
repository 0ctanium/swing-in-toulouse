import { integrationDbState } from "../setup/integration-db";
import {
  closePgTestDb,
  createPgTestDb,
  resetPgTestDb,
  type PgTestDb,
} from "./pg-test-db";

export async function setupIntegrationDb(): Promise<PgTestDb> {
  if (!integrationDbState.current) {
    integrationDbState.current = await createPgTestDb();
  }

  return integrationDbState.current;
}

export async function resetIntegrationDb() {
  if (!integrationDbState.current) {
    throw new Error("Integration DB is not initialized.");
  }

  await resetPgTestDb(integrationDbState.current);
}

export async function teardownIntegrationDb() {
  if (!integrationDbState.current) {
    return;
  }

  await closePgTestDb(integrationDbState.current);
  integrationDbState.current = null;
}
