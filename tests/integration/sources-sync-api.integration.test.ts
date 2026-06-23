import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  loadSourceWithOrganization,
  runSourceSync,
  sourceSyncResponse,
} from "@/lib/sources/sync-api";

import { FIXTURE_IDS } from "../helpers/seed";
import {
  FIXTURE_ICS_URL,
  readFixtureIcs,
  seedSyncWorkflowFixtures,
} from "../helpers/seed-workflows";
import {
  resetIntegrationDb,
  setupIntegrationDb,
} from "../helpers/setup-integration-db";

describe("sources sync API helpers", () => {
  beforeEach(async () => {
    await resetIntegrationDb();
    await seedSyncWorkflowFixtures(await setupIntegrationDb());

    const fixtureIcs = await readFixtureIcs();
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        if (String(input) === FIXTURE_ICS_URL) {
          return new Response(fixtureIcs, {
            status: 200,
            headers: { "content-type": "text/calendar" },
          });
        }

        return new Response("Not found", { status: 404 });
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("loads a source with its organization", async () => {
    const source = await loadSourceWithOrganization(FIXTURE_IDS.sourceA);

    expect(source?.organization?.slug).toBe("swing-club-a");
  });

  it("runs a source sync and returns stats", async () => {
    const result = await runSourceSync(FIXTURE_IDS.sourceA);

    expect(result.error).toBeNull();
    expect(result.stats?.created).toBeGreaterThan(0);
  });

  it("builds a JSON sync response", async () => {
    const source = await loadSourceWithOrganization(FIXTURE_IDS.sourceA);
    expect(source).not.toBeNull();

    const response = sourceSyncResponse(source!, {
      stats: {
        created: 2,
        updated: 0,
        unchanged: 0,
        cancelled: 0,
      },
      error: null,
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.sync.created).toBe(2);
  });

  it("returns an error payload when sync fails", async () => {
    const result = await runSourceSync("00000000-0000-4000-8000-000000000000");

    expect(result.stats).toBeNull();
    expect(result.error).toBeTruthy();
  });
});
