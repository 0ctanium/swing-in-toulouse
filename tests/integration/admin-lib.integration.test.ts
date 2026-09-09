import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { eventOverrides, events } from "@/db/schema";
import {
  getAdminAccessScope,
  getAdminDataScopeOrNull,
} from "@/lib/admin/access";
import { assertEventInDataScope } from "@/lib/admin/auth";
import { getEventsQueryEditKey } from "@/lib/admin/events-query-edit-key";
import { parseAdminEventsSearchParams } from "@/lib/events/admin-events-params";
import { listAdminEventsTable } from "@/lib/events/admin-events-table";
import { getEventConfirmQueue } from "@/lib/events/confirm-queue";
import {
  computeEffectiveOrganizationEventCounts,
  fetchMastersForOrganization,
} from "@/lib/organizations/effective-organization";
import { loadOrganizationDisplayVenue } from "@/lib/organizations/location";
import {
  getAdminVenuesPageData,
  getVenueConfirmationOverview,
  listVenuesWithStats,
} from "@/lib/venues/matching";
import { resolveVenueBySlug } from "@/lib/venues/canonical";

import { FIXTURE_CLERK_ORGS, FIXTURE_IDS } from "../helpers/seed";
import { seedLibIntegrationFixtures } from "../helpers/seed-lib";
import {
  resetIntegrationDb,
  setupIntegrationDb,
} from "../helpers/setup-integration-db";
import { setAnonymousClerkAuth, setClerkAuth } from "../setup/integration-mocks";

const workflowNow = new Date("2026-06-10T12:00:00.000Z");
const OVERRIDE_ASSIGNED_EVENT_ID = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

async function seedOverrideAssignedEvent() {
  const { db } = await setupIntegrationDb();

  await db.insert(events).values({
    id: OVERRIDE_ASSIGNED_EVENT_ID,
    sourceId: FIXTURE_IDS.sourceB,
    organizationId: null,
    venueId: FIXTURE_IDS.venue,
    uid: "override-assigned@swing-toulouse.fr",
    sourceUid: "override-assigned",
    slug: "bal-connexion-override",
    title: "Bal Connexion override",
    startAt: new Date("2026-06-22T18:00:00.000Z"),
    endAt: new Date("2026-06-22T21:00:00.000Z"),
    status: "published",
    confirmedAt: null,
  });

  await db.insert(eventOverrides).values({
    eventId: OVERRIDE_ASSIGNED_EVENT_ID,
    patch: { organizationId: FIXTURE_IDS.orgA },
  });
}

describe("admin access scope", () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    vi.setSystemTime(workflowNow);
    await resetIntegrationDb();
    await seedLibIntegrationFixtures(await setupIntegrationDb());
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("resolves platform admin access in personal space", async () => {
    setClerkAuth({
      userId: "user_platform_admin",
      role: "admin",
    });

    await expect(getAdminAccessScope()).resolves.toEqual(
      expect.objectContaining({
        userId: "user_platform_admin",
        isPlatformAdmin: true,
        organizationId: null,
      }),
    );
    await expect(getAdminDataScopeOrNull()).resolves.toEqual({ mode: "all" });
    await expect(getEventsQueryEditKey()).resolves.toBe("all");
  });

  it("resolves org member access scoped to the mapped organization", async () => {
    setClerkAuth({
      userId: "user_org_a",
      orgId: FIXTURE_CLERK_ORGS.orgA,
    });

    await expect(getAdminAccessScope()).resolves.toEqual(
      expect.objectContaining({
        userId: "user_org_a",
        isPlatformAdmin: false,
        organizationId: FIXTURE_IDS.orgA,
      }),
    );
    await expect(getAdminDataScopeOrNull()).resolves.toEqual({
      mode: "org",
      organizationId: FIXTURE_IDS.orgA,
    });
    await expect(getEventsQueryEditKey()).resolves.toBe(`org:${FIXTURE_CLERK_ORGS.orgA}`);
  });

  it("returns null scope for anonymous users", async () => {
    setAnonymousClerkAuth();

    await expect(getAdminAccessScope()).resolves.toBeNull();
    await expect(getAdminDataScopeOrNull()).resolves.toBeNull();
    await expect(getEventsQueryEditKey()).resolves.toBe("none");
  });
});

describe("venues admin data", () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    vi.setSystemTime(workflowNow);
    await resetIntegrationDb();
    await seedLibIntegrationFixtures(await setupIntegrationDb());
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("lists venues with event stats", async () => {
    const venues = await listVenuesWithStats();

    expect(venues.some((venue) => venue.slug === "le-grand-bal")).toBe(true);
    expect(
      venues.find((venue) => venue.slug === "le-grand-bal")?.eventCount,
    ).toBeGreaterThan(0);
  });

  it("resolves venue aliases to canonical venues", async () => {
    const resolution = await resolveVenueBySlug("alias-venue");

    expect(resolution?.kind).toBe("redirect");
    if (resolution?.kind === "redirect") {
      expect(resolution.targetSlug).toBe("le-grand-bal");
    }
  });

  it("builds admin venue pages and confirmation overview", async () => {
    const pageData = await getAdminVenuesPageData();
    expect(pageData.venues.length).toBeGreaterThan(0);

    const confirmation = await getVenueConfirmationOverview();
    expect(confirmation.pendingCount).toBeGreaterThanOrEqual(0);
  });
});

describe("organization effective counts", () => {
  beforeEach(async () => {
    await resetIntegrationDb();
    await seedLibIntegrationFixtures(await setupIntegrationDb());
  });

  it("counts events per organization including overrides", async () => {
    const counts = await computeEffectiveOrganizationEventCounts();

    expect(counts.get(FIXTURE_IDS.orgA)).toBeGreaterThanOrEqual(2);
    expect(counts.get(FIXTURE_IDS.orgB)).toBeGreaterThanOrEqual(1);
  });

  it("fetches masters for an organization", async () => {
    const masters = await fetchMastersForOrganization(FIXTURE_IDS.orgA);

    expect(masters.map((event) => event.id)).toEqual(
      expect.arrayContaining([FIXTURE_IDS.eventA]),
    );
  });

  it("loads the display venue for an organization", async () => {
    const venue = await loadOrganizationDisplayVenue(FIXTURE_IDS.venue);

    expect(venue?.slug).toBe("le-grand-bal");
  });
});

describe("org-scoped admin events with override assignment", () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    vi.setSystemTime(workflowNow);
    await resetIntegrationDb();
    await seedLibIntegrationFixtures(await setupIntegrationDb());
    await seedOverrideAssignedEvent();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("lists events assigned to the org only via override", async () => {
    const masters = await fetchMastersForOrganization(FIXTURE_IDS.orgA);
    expect(masters.map((event) => event.id)).toEqual(
      expect.arrayContaining([OVERRIDE_ASSIGNED_EVENT_ID]),
    );

    const query = parseAdminEventsSearchParams({ view: "all" });
    const orgATable = await listAdminEventsTable(query, {
      mode: "org",
      organizationId: FIXTURE_IDS.orgA,
    });
    const orgBTable = await listAdminEventsTable(query, {
      mode: "org",
      organizationId: FIXTURE_IDS.orgB,
    });

    expect(orgATable.rows.map((row) => row.id)).toEqual(
      expect.arrayContaining([OVERRIDE_ASSIGNED_EVENT_ID, FIXTURE_IDS.eventA]),
    );
    expect(
      orgATable.rows.find((row) => row.id === OVERRIDE_ASSIGNED_EVENT_ID),
    ).toEqual(
      expect.objectContaining({
        title: "Bal Connexion override",
        organizationId: FIXTURE_IDS.orgA,
        organizationName: "Swing Club A",
      }),
    );
    expect(orgBTable.rows.map((row) => row.id)).toEqual([FIXTURE_IDS.eventB]);
  });

  it("includes override-assigned events in the confirm queue", async () => {
    const queue = await getEventConfirmQueue({
      mode: "org",
      organizationId: FIXTURE_IDS.orgA,
    });

    expect(queue.map((item) => item.id)).toEqual(
      expect.arrayContaining([OVERRIDE_ASSIGNED_EVENT_ID]),
    );
  });

  it("allows org members to access override-assigned events", async () => {
    await expect(
      assertEventInDataScope(OVERRIDE_ASSIGNED_EVENT_ID, {
        mode: "org",
        organizationId: FIXTURE_IDS.orgA,
      }),
    ).resolves.toBe(true);
    await expect(
      assertEventInDataScope(OVERRIDE_ASSIGNED_EVENT_ID, {
        mode: "org",
        organizationId: FIXTURE_IDS.orgB,
      }),
    ).resolves.toBe(false);
  });
});
