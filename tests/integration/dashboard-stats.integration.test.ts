import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getAdminDashboardStats } from "@/lib/admin/dashboard-stats";
import { getAdminPendingEventsCount } from "@/lib/admin/pending-events";

import { FIXTURE_CLERK_ORGS, FIXTURE_IDS } from "../helpers/seed";
import { seedLibIntegrationFixtures } from "../helpers/seed-lib";
import {
  resetIntegrationDb,
  setupIntegrationDb,
} from "../helpers/setup-integration-db";
import { setClerkAuth } from "../setup/integration-mocks";

const workflowNow = new Date("2026-06-10T12:00:00.000Z");

describe("admin dashboard stats", () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    vi.setSystemTime(workflowNow);
    await resetIntegrationDb();
    await seedLibIntegrationFixtures(await setupIntegrationDb());
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns platform-wide stats for admins in personal space", async () => {
    setClerkAuth({
      userId: "user_platform_admin",
      role: "admin",
    });

    const stats = await getAdminDashboardStats({ mode: "all" });

    expect(stats.showPlatformStats).toBe(true);
    expect(stats.pendingEvents).toBeGreaterThanOrEqual(1);
    expect(stats.upcomingEventCount).toBeGreaterThan(0);
    expect(stats.activeSources).toBe(1);
    expect(stats.inactiveSources).toBe(1);
    expect(stats.activeOrganizers).toBeGreaterThan(0);
    expect(stats.lastSyncDisplay.value).not.toBe("-");
    expect(stats.recentFailedSyncs).toBeGreaterThanOrEqual(1);
  });

  it("scopes stats to the active organization", async () => {
    setClerkAuth({
      userId: "user_org_a",
      orgId: FIXTURE_CLERK_ORGS.orgA,
    });

    const stats = await getAdminDashboardStats({
      mode: "org",
      organizationId: FIXTURE_IDS.orgA,
    });

    expect(stats.showPlatformStats).toBe(false);
    expect(stats.pendingEvents).toBeGreaterThanOrEqual(1);
    expect(stats.activeSources).toBe(1);
    expect(stats.inactiveSources).toBe(0);
    expect(stats.activeOrganizers).toBe(1);
  });

  it("counts pending events for authenticated org members", async () => {
    setClerkAuth({
      userId: "user_org_a",
      orgId: FIXTURE_CLERK_ORGS.orgA,
    });

    await expect(getAdminPendingEventsCount()).resolves.toBeGreaterThanOrEqual(1);
  });

  it("returns zero pending events for anonymous users", async () => {
    setClerkAuth({ userId: null });

    await expect(getAdminPendingEventsCount()).resolves.toBe(0);
  });
});
