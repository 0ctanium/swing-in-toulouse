import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { eq } from "drizzle-orm";

import { events, syncLogs, venues } from "@/db/schema";
import { syncSourceById } from "@/lib/ical/sync";

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

describe("iCal sync workflow", () => {
  beforeEach(async () => {
    await resetIntegrationDb();
    await seedSyncWorkflowFixtures(await setupIntegrationDb());

    const fixtureIcs = await readFixtureIcs();
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);

        if (url === FIXTURE_ICS_URL) {
          return new Response(fixtureIcs, {
            status: 200,
            headers: { "content-type": "text/calendar" },
          });
        }

        return new Response("Not found", { status: 404 });
      }),
    );
  });

  it("imports events and venues from an iCal feed", async () => {
    const stats = await syncSourceById(FIXTURE_IDS.sourceA);

    expect(stats).toEqual({
      created: 2,
      updated: 0,
      unchanged: 0,
      cancelled: 0,
    });

    const { db } = await setupIntegrationDb();
    const importedEvents = await db.query.events.findMany({
      where: eq(events.sourceId, FIXTURE_IDS.sourceA),
      orderBy: (table, { asc }) => [asc(table.startAt)],
    });
    const importedVenues = await db.query.venues.findMany();
    const logs = await db.query.syncLogs.findMany({
      where: eq(syncLogs.sourceId, FIXTURE_IDS.sourceA),
    });

    expect(importedEvents).toHaveLength(2);
    expect(importedEvents[0]?.title).toBe("Bal Lindy Fixture");
    expect(importedEvents[0]?.organizationId).toBe(FIXTURE_IDS.orgA);
    expect(importedEvents[0]?.categories).toEqual(["lindy"]);
    expect(importedEvents[0]?.locationRaw).toContain("Le Petit Bal");
    expect(importedVenues.some((venue) => venue.name === "Le Petit Bal")).toBe(
      true,
    );
    expect(logs[0]?.status).toBe("success");
    expect(logs[0]?.eventsCreated).toBe(2);
  });

  it("updates existing events and cancels missing ones on re-sync", async () => {
    await syncSourceById(FIXTURE_IDS.sourceA);

    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(await readFixtureIcs("minimal-feed-updated.ics"), {
            status: 200,
            headers: { "content-type": "text/calendar" },
          }),
      ),
    );

    const stats = await syncSourceById(FIXTURE_IDS.sourceA);

    expect(stats).toEqual({
      created: 0,
      updated: 1,
      unchanged: 0,
      cancelled: 1,
    });

    const { db } = await setupIntegrationDb();
    const lindy = await db.query.events.findFirst({
      where: eq(events.sourceUid, "fixture-bal-lindy@sync.test"),
    });
    const blues = await db.query.events.findFirst({
      where: eq(events.sourceUid, "fixture-bal-blues@sync.test"),
    });

    expect(lindy?.title).toBe("Bal Lindy Mis à jour");
    expect(blues?.status).toBe("cancelled");
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });
});
