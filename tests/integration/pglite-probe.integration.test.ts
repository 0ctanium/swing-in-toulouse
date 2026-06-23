import { beforeEach, describe, expect, it } from "vitest";

import { probePgExtension } from "../helpers/pg-test-db";
import {
  resetIntegrationDb,
  setupIntegrationDb,
} from "../helpers/setup-integration-db";

describe("PGLite probe", () => {
  beforeEach(async () => {
    await resetIntegrationDb();
  });

  it("pushes the drizzle schema", async () => {
    const { client } = await setupIntegrationDb();
    const tables = await client.query<{ tablename: string }>(
      "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename",
    );

    expect(tables.rows.map((row) => row.tablename)).toContain("events");
    expect(tables.rows.map((row) => row.tablename)).toContain("organizations");
  });

  it("supports gen_random_uuid defaults used by the current schema", async () => {
    const { db } = await setupIntegrationDb();
    const { venues } = await import("@/db/schema");

    const [venue] = await db
      .insert(venues)
      .values({
        slug: "pglite-probe-venue",
        name: "PGLite Probe Venue",
      })
      .returning();

    expect(venue?.id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it("does not provide the uuidv7 extension", async () => {
    const { client } = await setupIntegrationDb();
    expect(await probePgExtension(client, "uuidv7")).toBe(false);
  });
});
