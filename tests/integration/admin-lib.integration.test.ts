import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  getAdminAccessScope,
  getAdminDataScopeOrNull,
} from "@/lib/admin/access";
import { getEventsQueryEditKey } from "@/lib/admin/events-query-edit-key";
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

    expect(masters.length).toBeGreaterThanOrEqual(2);
    expect(masters.every((event) => event.organizationId === FIXTURE_IDS.orgA)).toBe(
      true,
    );
  });

  it("loads the display venue for an organization", async () => {
    const venue = await loadOrganizationDisplayVenue(FIXTURE_IDS.venue);

    expect(venue?.slug).toBe("le-grand-bal");
  });
});
