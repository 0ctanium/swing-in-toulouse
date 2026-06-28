import { beforeEach, describe, expect, it } from "vitest";
import { addDays } from "date-fns";
import { eq } from "drizzle-orm";

import { POST as createManualEventRoute } from "@/app/api/admin/events/route";
import {
  DELETE as deleteManualEventRoute,
  PATCH as updateManualEventRoute,
} from "@/app/api/admin/events/[id]/route";
import { events } from "@/db/schema";

import {
  createJsonPostRequest,
  createJsonRequest,
  createTestRequest,
} from "../helpers/api";
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

async function createManualEventForTests() {
  setClerkAuth({
    userId: "user_platform_admin",
    role: "admin",
  });

  const schedule = futureEventRange();
  const response = await createManualEventRoute(
    createJsonPostRequest("/api/admin/events", {
      title: "Atelier manuel",
      startAt: schedule.startAt,
      endAt: schedule.endAt,
      organizationId: FIXTURE_IDS.orgA,
      venueId: FIXTURE_IDS.venue,
      status: "published",
    }),
  );

  const body = await response.json();
  expect(response.status).toBe(201);

  return body.event as { id: string; title: string; status: string };
}

describe("manual event mutations", () => {
  beforeEach(async () => {
    await resetIntegrationDb();
    await seedAuthMatrixFixtures(await setupIntegrationDb());
  });

  it("updates a manual event", async () => {
    const created = await createManualEventForTests();
    const schedule = futureEventRange(21);

    setClerkAuth({
      userId: "user_platform_admin",
      role: "admin",
    });

    const response = await updateManualEventRoute(
      createJsonRequest(`/api/admin/events/${created.id}`, "PATCH", {
        title: "Atelier mis à jour",
        startAt: schedule.startAt,
        endAt: schedule.endAt,
        organizationId: FIXTURE_IDS.orgA,
        venueId: FIXTURE_IDS.venue,
        status: "published",
      }),
      { params: Promise.resolve({ id: created.id }) },
    );

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.event.title).toBe("Atelier mis à jour");
  });

  it("clears recurrence when disabled on update", async () => {
    const created = await createManualEventForTests();
    const schedule = futureEventRange(21);

    setClerkAuth({
      userId: "user_platform_admin",
      role: "admin",
    });

    const withRecurrence = await updateManualEventRoute(
      createJsonRequest(`/api/admin/events/${created.id}`, "PATCH", {
        title: "Atelier mis à jour",
        startAt: schedule.startAt,
        endAt: schedule.endAt,
        organizationId: FIXTURE_IDS.orgA,
        venueId: FIXTURE_IDS.venue,
        status: "published",
        recurrence: {
          enabled: true,
          frequency: "weekly",
          interval: 1,
          byWeekday: ["TH"],
          monthlyMode: "day_of_month",
          end: { type: "never" },
        },
      }),
      { params: Promise.resolve({ id: created.id }) },
    );

    expect(withRecurrence.status).toBe(200);

    const withoutRecurrence = await updateManualEventRoute(
      createJsonRequest(`/api/admin/events/${created.id}`, "PATCH", {
        title: "Atelier mis à jour",
        startAt: schedule.startAt,
        endAt: schedule.endAt,
        organizationId: FIXTURE_IDS.orgA,
        venueId: FIXTURE_IDS.venue,
        status: "published",
        recurrence: {
          enabled: false,
          frequency: "weekly",
          interval: 1,
          byWeekday: ["TH"],
          monthlyMode: "day_of_month",
          end: { type: "never" },
        },
      }),
      { params: Promise.resolve({ id: created.id }) },
    );

    const body = await withoutRecurrence.json();

    expect(withoutRecurrence.status).toBe(200);
    expect(body.event.recurrenceRule).toBeNull();
  });

  it("rejects updates to synced events", async () => {
    setClerkAuth({
      userId: "user_platform_admin",
      role: "admin",
    });

    const schedule = futureEventRange();
    const response = await updateManualEventRoute(
      createJsonRequest(`/api/admin/events/${FIXTURE_IDS.eventA}`, "PATCH", {
        title: "Hack",
        startAt: schedule.startAt,
        endAt: schedule.endAt,
        status: "published",
      }),
      { params: Promise.resolve({ id: FIXTURE_IDS.eventA }) },
    );

    expect(response.status).toBe(400);
  });

  it("cancels a manual event by default on DELETE", async () => {
    const created = await createManualEventForTests();

    setClerkAuth({
      userId: "user_org_a",
      orgId: FIXTURE_CLERK_ORGS.orgA,
    });

    const response = await deleteManualEventRoute(
      createTestRequest(`/api/admin/events/${created.id}`, { method: "DELETE" }),
      { params: Promise.resolve({ id: created.id }) },
    );

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.event.status).toBe("cancelled");

    const testDb = await setupIntegrationDb();
    const stored = await testDb.db.query.events.findFirst({
      where: eq(events.id, created.id),
    });

    expect(stored?.status).toBe("cancelled");
  });

  it("requires platform admin for permanent deletion", async () => {
    const created = await createManualEventForTests();

    setClerkAuth({
      userId: "user_org_a",
      orgId: FIXTURE_CLERK_ORGS.orgA,
    });

    const response = await deleteManualEventRoute(
      createTestRequest(
        `/api/admin/events/${created.id}?permanent=1`,
        { method: "DELETE" },
      ),
      { params: Promise.resolve({ id: created.id }) },
    );

    expect(response.status).toBe(401);
  });

  it("permanently deletes a manual event for platform admins", async () => {
    const created = await createManualEventForTests();

    setClerkAuth({
      userId: "user_platform_admin",
      role: "admin",
    });

    const response = await deleteManualEventRoute(
      createTestRequest(
        `/api/admin/events/${created.id}?permanent=1`,
        { method: "DELETE" },
      ),
      { params: Promise.resolve({ id: created.id }) },
    );

    expect(response.status).toBe(200);

    const testDb = await setupIntegrationDb();
    const stored = await testDb.db.query.events.findFirst({
      where: eq(events.id, created.id),
    });

    expect(stored).toBeUndefined();
  });

  it("returns 401 for anonymous PATCH requests", async () => {
    setAnonymousClerkAuth();

    const schedule = futureEventRange();
    const response = await updateManualEventRoute(
      createJsonRequest(`/api/admin/events/${FIXTURE_IDS.eventA}`, "PATCH", {
        title: "Hack",
        startAt: schedule.startAt,
        endAt: schedule.endAt,
        status: "published",
      }),
      { params: Promise.resolve({ id: FIXTURE_IDS.eventA }) },
    );

    expect(response.status).toBe(401);
  });
});
