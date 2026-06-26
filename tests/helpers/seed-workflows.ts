import { readFile } from "node:fs/promises";
import path from "node:path";

import { eq } from "drizzle-orm";

import type { PgTestDb } from "./pg-test-db";
import { events, organizations, sources, venues } from "@/db/schema";

import {
  FIXTURE_CLERK_ORGS,
  FIXTURE_IDS,
} from "./seed";
import { projectIntegrationOccurrences } from "./project-occurrences";

export const FIXTURE_ICS_URL = "https://fixture.test/calendar.ics";

const workflowEventStartAt = new Date("2026-06-20T18:00:00.000Z");

export async function readFixtureIcs(name = "minimal-feed.ics") {
  return readFile(
    path.join(process.cwd(), "tests/fixtures/ics", name),
    "utf8",
  );
}

/** Source + org for iCal sync tests (no pre-existing events). */
export async function seedSyncWorkflowFixtures(testDb: PgTestDb) {
  await testDb.db.insert(organizations).values({
    id: FIXTURE_IDS.orgA,
    slug: "swing-club-a",
    name: "Swing Club A",
    clerkOrganizationId: FIXTURE_CLERK_ORGS.orgA,
  });

  await testDb.db.insert(sources).values({
    id: FIXTURE_IDS.sourceA,
    slug: "agenda-sync",
    name: "Agenda Sync",
    type: "ical",
    url: FIXTURE_ICS_URL,
    organizationId: FIXTURE_IDS.orgA,
    defaultCategories: ["lindy"],
  });
}

/** Pending upcoming event for confirm-queue workflow tests. */
export async function seedConfirmWorkflowFixtures(testDb: PgTestDb) {
  await testDb.db.insert(venues).values({
    id: FIXTURE_IDS.venue,
    slug: "le-grand-bal",
    name: "Le Grand Bal",
    addressConfirmedAt: new Date("2026-01-01T00:00:00.000Z"),
  });

  await testDb.db.insert(organizations).values({
    id: FIXTURE_IDS.orgA,
    slug: "swing-club-a",
    name: "Swing Club A",
    clerkOrganizationId: FIXTURE_CLERK_ORGS.orgA,
  });

  await testDb.db.insert(sources).values({
    id: FIXTURE_IDS.sourceA,
    slug: "agenda-a",
    name: "Agenda A",
    type: "ical",
    url: "https://example.com/a.ics",
    organizationId: FIXTURE_IDS.orgA,
  });

  await testDb.db.insert(events).values({
    id: FIXTURE_IDS.eventA,
    sourceId: FIXTURE_IDS.sourceA,
    organizationId: FIXTURE_IDS.orgA,
    venueId: FIXTURE_IDS.venue,
    uid: "pending-event@swing-toulouse.fr",
    sourceUid: "pending-event",
    slug: "soiree-pending",
    title: "Soirée en attente",
    startAt: workflowEventStartAt,
    endAt: new Date("2026-06-20T21:00:00.000Z"),
    status: "published",
    confirmedAt: null,
  });

  await projectIntegrationOccurrences();
}

/** Confirmed event for override workflow tests. */
export async function seedOverrideWorkflowFixtures(testDb: PgTestDb) {
  await seedConfirmWorkflowFixtures(testDb);

  await testDb.db
    .update(events)
    .set({ confirmedAt: new Date("2026-06-01T12:00:00.000Z") })
    .where(eq(events.id, FIXTURE_IDS.eventA));
}