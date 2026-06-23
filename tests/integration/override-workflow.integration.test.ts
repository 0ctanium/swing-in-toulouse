import { beforeEach, describe, expect, it } from "vitest";

import { GET as getPublicEvents } from "@/app/api/events/route";
import { PUT as putEventOverride } from "@/app/api/admin/events/[id]/override/route";

import { createJsonPostRequest, createTestRequest } from "../helpers/api";
import { FIXTURE_CLERK_ORGS, FIXTURE_IDS } from "../helpers/seed";
import { seedOverrideWorkflowFixtures } from "../helpers/seed-workflows";
import {
  resetIntegrationDb,
  setupIntegrationDb,
} from "../helpers/setup-integration-db";
import { setClerkAuth } from "../setup/integration-mocks";

describe("event override workflow", () => {
  beforeEach(async () => {
    await resetIntegrationDb();
    await seedOverrideWorkflowFixtures(await setupIntegrationDb());
    setClerkAuth({
      userId: "user_org_a",
      orgId: FIXTURE_CLERK_ORGS.orgA,
    });
  });

  it("applies a master override visible on the public agenda API", async () => {
    const overrideResponse = await putEventOverride(
      createJsonPostRequest(`/api/admin/events/${FIXTURE_IDS.eventA}/override`, {
        patch: { title: "Titre corrigé admin" },
      }),
      { params: Promise.resolve({ id: FIXTURE_IDS.eventA }) },
    );

    expect(overrideResponse.status).toBe(200);

    const publicResponse = await getPublicEvents(
      createTestRequest(
        "/api/events?from=2026-06-01T00:00:00.000Z&to=2026-06-30T23:59:59.999Z",
      ),
    );
    const body = await publicResponse.json();

    expect(publicResponse.status).toBe(200);
    expect(
      body.events.find(
        (event: { masterEventId: string }) =>
          event.masterEventId === FIXTURE_IDS.eventA,
      )?.title,
    ).toBe("Titre corrigé admin");
  });
});
