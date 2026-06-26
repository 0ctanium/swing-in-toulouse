import type { PgTestDb } from "./pg-test-db";
import { projectIntegrationOccurrences } from "./project-occurrences";
import {
  eventCategoryTags,
  eventOverrides,
  events,
  organizations,
  sources,
  syncLogs,
  venues,
} from "@/db/schema";

import { FIXTURE_CLERK_ORGS, FIXTURE_IDS } from "./seed";

const upcomingStart = new Date("2026-06-20T18:00:00.000Z");

/** Rich fixtures for lib-layer integration tests (queries, stats, duplicates, tags). */
export async function seedLibIntegrationFixtures(testDb: PgTestDb) {
  await testDb.db.insert(venues).values([
    {
      id: FIXTURE_IDS.venue,
      slug: "le-grand-bal",
      name: "Le Grand Bal",
      city: "Toulouse",
      address: "12 rue du Swing",
      latitude: 43.6046,
      longitude: 1.4442,
      addressConfirmedAt: new Date("2026-01-01T00:00:00.000Z"),
    },
    {
      id: "88888888-8888-4888-8888-888888888888",
      slug: "alias-venue",
      name: "Alias Venue",
      city: "Toulouse",
      canonicalVenueId: FIXTURE_IDS.venue,
    },
  ]);

  await testDb.db.insert(organizations).values([
    {
      id: FIXTURE_IDS.orgA,
      slug: "swing-club-a",
      name: "Swing Club A",
      clerkOrganizationId: FIXTURE_CLERK_ORGS.orgA,
      venueId: FIXTURE_IDS.venue,
      isActive: true,
    },
    {
      id: FIXTURE_IDS.orgB,
      slug: "swing-club-b",
      name: "Swing Club B",
      clerkOrganizationId: FIXTURE_CLERK_ORGS.orgB,
      isActive: true,
    },
  ]);

  await testDb.db.insert(sources).values([
    {
      id: FIXTURE_IDS.sourceA,
      slug: "agenda-a",
      name: "Agenda A",
      type: "ical",
      url: "https://example.com/a.ics",
      organizationId: FIXTURE_IDS.orgA,
      defaultCategories: ["lindy"],
      isActive: true,
    },
    {
      id: FIXTURE_IDS.sourceB,
      slug: "agenda-b",
      name: "Agenda B",
      type: "ical",
      url: "https://example.com/b.ics",
      organizationId: FIXTURE_IDS.orgB,
      defaultCategories: ["blues"],
      isActive: false,
    },
  ]);

  await testDb.db.insert(events).values([
    {
      id: FIXTURE_IDS.eventA,
      sourceId: FIXTURE_IDS.sourceA,
      organizationId: FIXTURE_IDS.orgA,
      venueId: FIXTURE_IDS.venue,
      uid: "event-a@swing-toulouse.fr",
      sourceUid: "event-a",
      slug: "soiree-lindy-a",
      title: "Soirée Lindy A",
      startAt: upcomingStart,
      endAt: new Date("2026-06-20T21:00:00.000Z"),
      status: "published",
      categories: ["lindy", "soiree"],
      confirmedAt: new Date("2026-06-01T12:00:00.000Z"),
    },
    {
      id: FIXTURE_IDS.eventB,
      sourceId: FIXTURE_IDS.sourceB,
      organizationId: FIXTURE_IDS.orgB,
      venueId: FIXTURE_IDS.venue,
      uid: "event-b@swing-toulouse.fr",
      sourceUid: "event-b",
      slug: "soiree-lindy-b",
      title: "Soirée Lindy A",
      startAt: new Date("2026-06-20T18:30:00.000Z"),
      endAt: new Date("2026-06-20T21:30:00.000Z"),
      status: "published",
      categories: ["blues"],
      confirmedAt: new Date("2026-06-01T12:00:00.000Z"),
    },
    {
      id: "99999999-9999-4999-8999-999999999999",
      sourceId: FIXTURE_IDS.sourceA,
      organizationId: FIXTURE_IDS.orgA,
      venueId: FIXTURE_IDS.venue,
      uid: "pending@swing-toulouse.fr",
      sourceUid: "pending",
      slug: "soiree-pending",
      title: "Soirée en attente",
      startAt: new Date("2026-06-25T18:00:00.000Z"),
      endAt: new Date("2026-06-25T21:00:00.000Z"),
      status: "published",
      confirmedAt: null,
    },
  ]);

  await testDb.db.insert(eventCategoryTags).values({
    name: "lindy",
    tagType: "danse",
    slug: "lindy-hop",
    isPublished: true,
  });

  await testDb.db.insert(eventOverrides).values({
    eventId: FIXTURE_IDS.eventA,
    patch: { title: "Titre overridé" },
  });

  await testDb.db.insert(syncLogs).values([
    {
      sourceId: FIXTURE_IDS.sourceA,
      status: "success",
      message: "Sync OK",
      eventsCreated: 2,
      eventsUpdated: 1,
      eventsCancelled: 0,
    },
    {
      sourceId: FIXTURE_IDS.sourceB,
      status: "failed",
      message: "Fetch failed",
      eventsCreated: 0,
      eventsUpdated: 0,
      eventsCancelled: 0,
    },
  ]);

  await projectIntegrationOccurrences();
}
