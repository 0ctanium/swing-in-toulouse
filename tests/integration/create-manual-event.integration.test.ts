import { beforeEach, describe, expect, it } from "vitest";
import { addDays } from "date-fns";
import { eq } from "drizzle-orm";

import { POST as createManualEventRoute } from "@/app/api/admin/events/route";
import { eventOccurrences, sources } from "@/db/schema";

import { createJsonPostRequest } from "../helpers/api";
import {
  FIXTURE_CLERK_ORGS,
  FIXTURE_IDS,
  seedAuthMatrixFixtures,
} from "../helpers/seed";
import {
  resetIntegrationDb,
  setupIntegrationDb,
} from "../helpers/setup-integration-db";
import { setAnonymousClerkAuth, setClerkAuth } from "../setup/integration-mocks";

function futureEventRange(daysAhead = 14) {
  const startAt = addDays(new Date(), daysAhead);
  startAt.setUTCHours(18, 0, 0, 0);

  const endAt = new Date(startAt);
  endAt.setUTCHours(21, 0, 0, 0);

  return {
    startAt: startAt.toISOString(),
    endAt: endAt.toISOString(),
  };
}

describe("POST /api/admin/events", () => {
  beforeEach(async () => {
    await resetIntegrationDb();
    await seedAuthMatrixFixtures(await setupIntegrationDb());
  });

  it("returns 401 for anonymous users", async () => {
    setAnonymousClerkAuth();

    const response = await createManualEventRoute(
      createJsonPostRequest("/api/admin/events", {
        title: "Soirée test",
        startAt: "2026-07-01T18:00:00.000Z",
        endAt: "2026-07-01T21:00:00.000Z",
      }),
    );

    expect(response.status).toBe(401);
  });

  it("creates a confirmed manual event for a platform admin", async () => {
    setClerkAuth({
      userId: "user_platform_admin",
      role: "admin",
    });

    const schedule = futureEventRange();

    const response = await createManualEventRoute(
      createJsonPostRequest("/api/admin/events", {
        title: "Atelier manuel",
        description: "Créé depuis l'admin",
        startAt: schedule.startAt,
        endAt: schedule.endAt,
        organizationId: FIXTURE_IDS.orgA,
        venueId: FIXTURE_IDS.venue,
        categories: ["lindy-hop"],
        status: "published",
      }),
    );

    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.event.title).toBe("Atelier manuel");
    expect(body.event.confirmedAt).not.toBeNull();
    expect(body.event.organizationId).toBe(FIXTURE_IDS.orgA);

    const testDb = await setupIntegrationDb();
    const manualSource = await testDb.db.query.sources.findFirst({
      where: eq(sources.type, "manual"),
    });

    expect(manualSource).not.toBeNull();
    expect(manualSource?.organizationId).toBe(FIXTURE_IDS.orgA);

    const occurrences = await testDb.db.query.eventOccurrences.findMany({
      where: eq(eventOccurrences.masterEventId, body.event.id),
    });

    expect(occurrences).toHaveLength(1);
    expect(occurrences[0]?.title).toBe("Atelier manuel");
  });

  it("forces the current organization for org members", async () => {
    setClerkAuth({
      userId: "user_org_a",
      orgId: FIXTURE_CLERK_ORGS.orgA,
    });

    const schedule = futureEventRange(21);

    const response = await createManualEventRoute(
      createJsonPostRequest("/api/admin/events", {
        title: "Soirée org A",
        startAt: schedule.startAt,
        endAt: schedule.endAt,
        organizationId: FIXTURE_IDS.orgB,
      }),
    );

    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.event.organizationId).toBe(FIXTURE_IDS.orgA);
  });

  it("allows platform admins to create events without an organizer", async () => {
    setClerkAuth({
      userId: "user_platform_admin",
      role: "admin",
    });

    const schedule = futureEventRange(28);

    const response = await createManualEventRoute(
      createJsonPostRequest("/api/admin/events", {
        title: "Jam ouverte",
        startAt: schedule.startAt,
        endAt: schedule.endAt,
        organizationId: null,
      }),
    );

    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.event.organizationId).toBeNull();

    const testDb = await setupIntegrationDb();
    const manualSource = await testDb.db.query.sources.findFirst({
      where: eq(sources.type, "manual"),
    });

    expect(manualSource?.organizationId).toBeNull();
  });
});
