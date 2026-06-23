import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { emptyIcalPayload } from "@/lib/ical/payload";
import {
  buildIcalFeedResponse,
  getFilteredEventsForExport,
} from "@/lib/ical/feed";
import { buildNormalizedEventsForExport } from "@/lib/ical/export-events";
import { loadOverridesForEvents } from "@/lib/events/overrides";

import { FIXTURE_IDS } from "../helpers/seed";
import { seedLibIntegrationFixtures } from "../helpers/seed-lib";
import {
  resetIntegrationDb,
  setupIntegrationDb,
} from "../helpers/setup-integration-db";

const workflowNow = new Date("2026-06-10T12:00:00.000Z");

describe("iCal export", () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    vi.setSystemTime(workflowNow);
    await resetIntegrationDb();
    await seedLibIntegrationFixtures(await setupIntegrationDb());
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("exports all upcoming events by default", async () => {
    const events = await getFilteredEventsForExport(emptyIcalPayload());

    expect(events.length).toBeGreaterThanOrEqual(2);
  });

  it("filters export by organization slug", async () => {
    const events = await getFilteredEventsForExport({
      ...emptyIcalPayload(),
      org: ["swing-club-a"],
    });

    expect(events.every((event) => event.organizationId === FIXTURE_IDS.orgA)).toBe(
      true,
    );
  });

  it("exports a single event by slug", async () => {
    const events = await getFilteredEventsForExport({
      ...emptyIcalPayload(),
      event: ["soiree-lindy-a"],
    });

    expect(events).toHaveLength(1);
    expect(events[0]?.slug).toBe("soiree-lindy-a");
  });

  it("builds normalized events and a calendar response", async () => {
    const masters = await getFilteredEventsForExport({
      ...emptyIcalPayload(),
      event: ["soiree-lindy-a"],
    });
    const overrides = await loadOverridesForEvents(masters.map((event) => event.id));
    const normalized = await buildNormalizedEventsForExport(masters, overrides);

    expect(normalized[0]?.title).toBe("Titre overridé");

    const response = await buildIcalFeedResponse({
      ...emptyIcalPayload(),
      event: ["soiree-lindy-a"],
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/calendar");

    const body = await response.text();
    expect(body).toContain("BEGIN:VCALENDAR");
    expect(body).toContain("Titre overridé");
  });
});
