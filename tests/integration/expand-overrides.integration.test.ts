import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { eq } from "drizzle-orm";

import type { EventMaster } from "@/db/schema";
import { events } from "@/db/schema";
import {
  expandEventsWithOverrides,
  mergeMastersWithMasterOverrides,
} from "@/lib/events/expand-with-overrides";
import { getDefaultExpansionWindow } from "@/lib/ical/recurrence";

import { FIXTURE_IDS } from "../helpers/seed";
import { seedLibIntegrationFixtures } from "../helpers/seed-lib";
import {
  resetIntegrationDb,
  setupIntegrationDb,
} from "../helpers/setup-integration-db";

const workflowNow = new Date("2026-06-10T12:00:00.000Z");

describe("expand events with overrides", () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    vi.setSystemTime(workflowNow);
    await resetIntegrationDb();
    await seedLibIntegrationFixtures(await setupIntegrationDb());
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("merges master overrides onto event masters", async () => {
    const { db } = await setupIntegrationDb();
    const master = (await db.query.events.findFirst({
      where: eq(events.id, FIXTURE_IDS.eventA),
      with: {
        source: true,
        organization: true,
        venue: true,
      },
    })) as EventMaster;

    const merged = await mergeMastersWithMasterOverrides([master]);

    expect(merged[0]?.title).toBe("Titre overridé");
  });

  it("expands merged masters into occurrences for a window", async () => {
    const { db } = await setupIntegrationDb();
    const master = (await db.query.events.findFirst({
      where: eq(events.id, FIXTURE_IDS.eventA),
      with: {
        source: true,
        organization: true,
        venue: true,
      },
    })) as EventMaster;

    const window = getDefaultExpansionWindow(new Date("2026-06-01T00:00:00.000Z"));
    const occurrences = await expandEventsWithOverrides([master], window);

    expect(occurrences.length).toBeGreaterThan(0);
    expect(occurrences[0]?.title).toBe("Titre overridé");
  });
});
