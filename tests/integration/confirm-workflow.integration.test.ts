import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { eq } from "drizzle-orm";

import { POST as confirmEventRoute } from "@/app/api/admin/events/[id]/confirm/route";
import { events } from "@/db/schema";
import { getEventConfirmQueue, getEventConfirmQueueStats } from "@/lib/events/confirm-queue";

import { createJsonPostRequest } from "../helpers/api";
import { FIXTURE_CLERK_ORGS, FIXTURE_IDS } from "../helpers/seed";
import { seedConfirmWorkflowFixtures } from "../helpers/seed-workflows";
import {
  resetIntegrationDb,
  setupIntegrationDb,
} from "../helpers/setup-integration-db";
import { setClerkAuth } from "../setup/integration-mocks";

const workflowNow = new Date("2026-06-10T12:00:00.000Z");

describe("confirm event workflow", () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    vi.setSystemTime(workflowNow);
    await resetIntegrationDb();
    await seedConfirmWorkflowFixtures(await setupIntegrationDb());
    setClerkAuth({
      userId: "user_org_a",
      orgId: FIXTURE_CLERK_ORGS.orgA,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("lists pending upcoming events in the confirm queue", async () => {
    const queue = await getEventConfirmQueue({
      mode: "org",
      organizationId: FIXTURE_IDS.orgA,
    });

    expect(queue).toHaveLength(1);
    expect(queue[0]?.id).toBe(FIXTURE_IDS.eventA);
    expect(queue[0]?.title).toBe("Soirée en attente");
  });

  it("moves an event from pending to confirmed", async () => {
    const statsBefore = await getEventConfirmQueueStats({
      mode: "org",
      organizationId: FIXTURE_IDS.orgA,
    });
    expect(statsBefore.pendingCount).toBe(1);
    expect(statsBefore.confirmedCount).toBe(0);

    const response = await confirmEventRoute(
      createJsonPostRequest(`/api/admin/events/${FIXTURE_IDS.eventA}/confirm`, {}),
      { params: Promise.resolve({ id: FIXTURE_IDS.eventA }) },
    );

    expect(response.status).toBe(200);

    const queue = await getEventConfirmQueue({
      mode: "org",
      organizationId: FIXTURE_IDS.orgA,
    });
    const statsAfter = await getEventConfirmQueueStats({
      mode: "org",
      organizationId: FIXTURE_IDS.orgA,
    });

    expect(queue).toHaveLength(0);
    expect(statsAfter.pendingCount).toBe(0);
    expect(statsAfter.confirmedCount).toBe(1);

    const { db } = await setupIntegrationDb();
    const event = await db.query.events.findFirst({
      where: eq(events.id, FIXTURE_IDS.eventA),
    });

    expect(event?.confirmedAt).not.toBeNull();
  });
});
