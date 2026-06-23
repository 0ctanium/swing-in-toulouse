import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { eq } from "drizzle-orm";

import { eventOverrides, venues } from "@/db/schema";
import {
  computeEffectiveVenueEventCounts,
  fetchMastersForVenue,
} from "@/lib/venues/effective-venue";
import {
  bulkAssignVenue,
  findEventsForVenueAssignment,
} from "@/lib/venues/matching";

import { FIXTURE_IDS } from "../helpers/seed";
import { seedLibIntegrationFixtures } from "../helpers/seed-lib";
import {
  resetIntegrationDb,
  setupIntegrationDb,
} from "../helpers/setup-integration-db";

const workflowNow = new Date("2026-06-10T12:00:00.000Z");

describe("venue matching and effective venue queries", () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    vi.setSystemTime(workflowNow);
    await resetIntegrationDb();
    await seedLibIntegrationFixtures(await setupIntegrationDb());
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("counts events per effective venue", async () => {
    const counts = await computeEffectiveVenueEventCounts();

    expect(counts.get(FIXTURE_IDS.venue)).toBeGreaterThanOrEqual(2);
  });

  it("fetches masters linked to a venue and its aliases", async () => {
    const masters = await fetchMastersForVenue(FIXTURE_IDS.venue);

    expect(masters.length).toBeGreaterThanOrEqual(2);
  });

  it("finds events for assignment by explicit event ids", async () => {
    const result = await findEventsForVenueAssignment({
      eventIds: [FIXTURE_IDS.eventA],
    });

    expect(result.events).toHaveLength(1);
    expect(result.events[0]?.id).toBe(FIXTURE_IDS.eventA);
  });

  it("bulk-assigns events to a target venue via overrides", async () => {
    const newVenueId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    const { db } = await setupIntegrationDb();

    await db.insert(venues).values({
      id: newVenueId,
      slug: "nouveau-lieu",
      name: "Nouveau Lieu",
      city: "Toulouse",
    });

    const result = await bulkAssignVenue({
      targetVenueId: newVenueId,
      eventIds: [FIXTURE_IDS.eventB],
    });

    expect(result.updated).toBe(1);

    const override = await db.query.eventOverrides.findFirst({
      where: eq(eventOverrides.eventId, FIXTURE_IDS.eventB),
    });

    expect(override?.patch.venueId).toBe(newVenueId);
  });
});
