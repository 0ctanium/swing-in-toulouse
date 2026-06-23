import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  getAdminEventOccurrences,
  getEventBySlug,
  getEventsForExport,
  getOrganizerBySlug,
  getRelatedEventsUncached,
  getUpcomingEventsUncached,
  getVenueBySlug,
  listAdminEvents,
  listEventArchiveMonthsUncached,
  listEventsInMonthUncached,
  listOrganizersForVenueUncached,
  listOrganizersUncached,
  listUpcomingEventsForHubUncached,
  resolveEventBySlug,
} from "@/lib/events/queries";

import { FIXTURE_IDS } from "../helpers/seed";
import { seedLibIntegrationFixtures } from "../helpers/seed-lib";
import {
  resetIntegrationDb,
  setupIntegrationDb,
} from "../helpers/setup-integration-db";

const workflowNow = new Date("2026-06-10T12:00:00.000Z");

describe("events queries", () => {
  beforeEach(async () => {
    vi.useFakeTimers();
    vi.setSystemTime(workflowNow);
    await resetIntegrationDb();
    await seedLibIntegrationFixtures(await setupIntegrationDb());
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("loads upcoming events for the agenda window", async () => {
    const events = await getUpcomingEventsUncached({
      from: new Date("2026-06-01T00:00:00.000Z"),
      to: new Date("2026-06-30T23:59:59.999Z"),
    });

    expect(events.length).toBeGreaterThanOrEqual(2);
    expect(events.map((event) => event.slug)).toEqual(
      expect.arrayContaining(["soiree-lindy-a", "soiree-lindy-b"]),
    );
  });

  it("filters upcoming events by organization slug", async () => {
    const events = await getUpcomingEventsUncached({
      organizationSlug: "swing-club-a",
      from: new Date("2026-06-01T00:00:00.000Z"),
      to: new Date("2026-06-30T23:59:59.999Z"),
    });

    expect(events.every((event) => event.organization?.slug === "swing-club-a")).toBe(
      true,
    );
  });

  it("resolves events, organizers, and venues by slug", async () => {
    const eventResolution = await resolveEventBySlug("soiree-lindy-a");
    expect(eventResolution?.kind).toBe("event");

    const event = await getEventBySlug("soiree-lindy-a");
    expect(event?.title).toBe("Titre overridé");

    const organizer = await getOrganizerBySlug("swing-club-a");
    expect(organizer?.name).toBe("Swing Club A");
    expect(organizer?.events.length).toBeGreaterThan(0);

    const venue = await getVenueBySlug("le-grand-bal");
    expect(venue?.name).toBe("Le Grand Bal");
    expect(venue?.events.length).toBeGreaterThan(0);
  });

  it("lists active organizers and organizers for a venue", async () => {
    const organizers = await listOrganizersUncached();
    expect(organizers.map((org) => org.slug)).toEqual(
      expect.arrayContaining(["swing-club-a", "swing-club-b"]),
    );

    const venueOrganizers = await listOrganizersForVenueUncached(FIXTURE_IDS.venue);
    expect(venueOrganizers.map((org) => org.slug)).toContain("swing-club-a");
  });

  it("returns related events for the same organization", async () => {
    const related = await getRelatedEventsUncached(
      "soiree-pending",
      "swing-club-a",
      null,
      5,
    );

    expect(related.length).toBeGreaterThan(0);
    expect(related.every((event) => event.slug !== "soiree-pending")).toBe(true);
  });

  it("lists events in a calendar month", async () => {
    const juneEvents = await listEventsInMonthUncached(2026, 6);

    expect(juneEvents.length).toBeGreaterThan(0);
    expect(juneEvents[0]?.startAt.getMonth()).toBe(5);
  });

  it("lists admin events and occurrence details", async () => {
    const adminEvents = await listAdminEvents();
    expect(adminEvents.length).toBeGreaterThan(0);

    const result = await getAdminEventOccurrences(FIXTURE_IDS.eventA);
    expect(result?.occurrences.length).toBeGreaterThan(0);
    expect(result?.occurrences[0]?.masterEventId).toBe(FIXTURE_IDS.eventA);
  });

  it("loads hub and archive helpers", async () => {
    const hubEvents = await listUpcomingEventsForHubUncached();
    expect(hubEvents.length).toBeGreaterThan(0);

    const archiveMonths = await listEventArchiveMonthsUncached();
    expect(archiveMonths.length).toBeGreaterThanOrEqual(0);

    const exportEvents = await getEventsForExport();
    expect(exportEvents.length).toBeGreaterThan(0);
  });
});
