import type { PgTestDb } from "./pg-test-db";
import { projectIntegrationOccurrences } from "./project-occurrences";
import { events, organizations, sources, venues } from "@/db/schema";

export const FIXTURE_IDS = {
  venue: "33333333-3333-4333-8333-333333333333",
  orgA: "11111111-1111-4111-8111-111111111111",
  orgB: "22222222-2222-4222-8222-222222222222",
  sourceA: "44444444-4444-4444-8444-444444444444",
  sourceB: "55555555-5555-4555-8555-555555555555",
  eventA: "66666666-6666-4666-8666-666666666666",
  eventB: "77777777-7777-4777-8777-777777777777",
} as const;

export const FIXTURE_CLERK_ORGS = {
  orgA: "org_clerk_a",
  orgB: "org_clerk_b",
  unmapped: "org_clerk_unmapped",
} as const;

const eventStartAt = new Date("2026-06-15T18:00:00.000Z");

export async function seedAuthMatrixFixtures(testDb: PgTestDb) {
  await testDb.db.insert(venues).values({
    id: FIXTURE_IDS.venue,
    slug: "le-grand-bal",
    name: "Le Grand Bal",
  });

  await testDb.db.insert(organizations).values([
    {
      id: FIXTURE_IDS.orgA,
      slug: "swing-club-a",
      name: "Swing Club A",
      clerkOrganizationId: FIXTURE_CLERK_ORGS.orgA,
    },
    {
      id: FIXTURE_IDS.orgB,
      slug: "swing-club-b",
      name: "Swing Club B",
      clerkOrganizationId: FIXTURE_CLERK_ORGS.orgB,
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
    },
    {
      id: FIXTURE_IDS.sourceB,
      slug: "agenda-b",
      name: "Agenda B",
      type: "ical",
      url: "https://example.com/b.ics",
      organizationId: FIXTURE_IDS.orgB,
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
      startAt: eventStartAt,
      endAt: new Date("2026-06-15T21:00:00.000Z"),
      status: "published",
    },
    {
      id: FIXTURE_IDS.eventB,
      sourceId: FIXTURE_IDS.sourceB,
      organizationId: FIXTURE_IDS.orgB,
      venueId: FIXTURE_IDS.venue,
      uid: "event-b@swing-toulouse.fr",
      sourceUid: "event-b",
      slug: "soiree-lindy-b",
      title: "Soirée Lindy B",
      startAt: eventStartAt,
      endAt: new Date("2026-06-15T21:00:00.000Z"),
      status: "published",
    },
  ]);

  await projectIntegrationOccurrences();
}
