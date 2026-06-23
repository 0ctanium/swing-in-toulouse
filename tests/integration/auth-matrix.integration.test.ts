import { beforeEach, describe, expect, it } from "vitest";

import { GET as getAdminVenues } from "@/app/api/admin/venues/route";
import { POST as confirmEventRoute } from "@/app/api/admin/events/[id]/confirm/route";
import { GET as getPublicEvents } from "@/app/api/events/route";

import { createJsonPostRequest, createTestRequest } from "../helpers/api";
import {
  seedAuthMatrixFixtures,
  FIXTURE_CLERK_ORGS,
  FIXTURE_IDS,
} from "../helpers/seed";
import {
  resetIntegrationDb,
  setupIntegrationDb,
} from "../helpers/setup-integration-db";
import { setAnonymousClerkAuth, setClerkAuth } from "../setup/integration-mocks";

describe("admin API auth matrix", () => {
  beforeEach(async () => {
    await resetIntegrationDb();
    await seedAuthMatrixFixtures(await setupIntegrationDb());
  });

  describe("GET /api/admin/venues", () => {
    it("returns 401 for anonymous users", async () => {
      setAnonymousClerkAuth();

      const response = await getAdminVenues();

      expect(response.status).toBe(401);
    });

    it("returns 401 for org members", async () => {
      setClerkAuth({
        userId: "user_org_a",
        orgId: FIXTURE_CLERK_ORGS.orgA,
      });

      const response = await getAdminVenues();

      expect(response.status).toBe(401);
    });

    it("returns 200 for platform admins in personal space", async () => {
      setClerkAuth({
        userId: "user_platform_admin",
        role: "admin",
      });

      const response = await getAdminVenues();
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toHaveProperty("venues");
    });
  });

  describe("POST /api/admin/events/:id/confirm", () => {
    it("returns 401 for anonymous users", async () => {
      setAnonymousClerkAuth();

      const response = await confirmEventRoute(
        createJsonPostRequest(
          `/api/admin/events/${FIXTURE_IDS.eventA}/confirm`,
          {},
        ),
        { params: Promise.resolve({ id: FIXTURE_IDS.eventA }) },
      );

      expect(response.status).toBe(401);
    });

    it("returns 401 when an org member targets another organization's event", async () => {
      setClerkAuth({
        userId: "user_org_a",
        orgId: FIXTURE_CLERK_ORGS.orgA,
      });

      const response = await confirmEventRoute(
        createJsonPostRequest(
          `/api/admin/events/${FIXTURE_IDS.eventB}/confirm`,
          {},
        ),
        { params: Promise.resolve({ id: FIXTURE_IDS.eventB }) },
      );

      expect(response.status).toBe(401);
    });

    it("confirms an event in scope for an org member", async () => {
      setClerkAuth({
        userId: "user_org_a",
        orgId: FIXTURE_CLERK_ORGS.orgA,
      });

      const response = await confirmEventRoute(
        createJsonPostRequest(
          `/api/admin/events/${FIXTURE_IDS.eventA}/confirm`,
          {},
        ),
        { params: Promise.resolve({ id: FIXTURE_IDS.eventA }) },
      );
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.event.id).toBe(FIXTURE_IDS.eventA);
      expect(body.event.confirmedAt).not.toBeNull();
    });

    it("allows platform admins in personal space to confirm any event", async () => {
      setClerkAuth({
        userId: "user_platform_admin",
        role: "admin",
      });

      const response = await confirmEventRoute(
        createJsonPostRequest(
          `/api/admin/events/${FIXTURE_IDS.eventB}/confirm`,
          {},
        ),
        { params: Promise.resolve({ id: FIXTURE_IDS.eventB }) },
      );

      expect(response.status).toBe(200);
    });

    it("scopes platform admins to the active org when one is selected", async () => {
      setClerkAuth({
        userId: "user_platform_admin",
        orgId: FIXTURE_CLERK_ORGS.orgA,
        role: "admin",
      });

      const allowed = await confirmEventRoute(
        createJsonPostRequest(
          `/api/admin/events/${FIXTURE_IDS.eventA}/confirm`,
          {},
        ),
        { params: Promise.resolve({ id: FIXTURE_IDS.eventA }) },
      );
      const denied = await confirmEventRoute(
        createJsonPostRequest(
          `/api/admin/events/${FIXTURE_IDS.eventB}/confirm`,
          {},
        ),
        { params: Promise.resolve({ id: FIXTURE_IDS.eventB }) },
      );

      expect(allowed.status).toBe(200);
      expect(denied.status).toBe(401);
    });
  });

  describe("GET /api/events", () => {
    it("returns public events without authentication", async () => {
      setAnonymousClerkAuth();

      const response = await getPublicEvents(
        createTestRequest(
          "/api/events?from=2026-06-01T00:00:00.000Z&to=2026-06-30T23:59:59.999Z",
        ),
      );
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.events).toHaveLength(2);
      expect(body.events.map((event: { title: string }) => event.title)).toEqual(
        expect.arrayContaining(["Soirée Lindy A", "Soirée Lindy B"]),
      );
    });
  });
});
