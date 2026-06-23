import { beforeEach, describe, expect, it } from "vitest";

import {
  findDuplicateCandidates,
  getDuplicateLinkInfo,
  linkDuplicateEvent,
  unlinkDuplicateEvent,
} from "@/lib/events/duplicates";

import { FIXTURE_IDS } from "../helpers/seed";
import { seedLibIntegrationFixtures } from "../helpers/seed-lib";
import {
  resetIntegrationDb,
  setupIntegrationDb,
} from "../helpers/setup-integration-db";

describe("event duplicates workflow", () => {
  beforeEach(async () => {
    await resetIntegrationDb();
    await seedLibIntegrationFixtures(await setupIntegrationDb());
  });

  it("finds cross-source duplicate candidates with similar titles", async () => {
    const candidates = await findDuplicateCandidates(FIXTURE_IDS.eventA);

    expect(candidates.some((candidate) => candidate.id === FIXTURE_IDS.eventB)).toBe(
      true,
    );
  });

  it("links and unlinks duplicate events", async () => {
    await linkDuplicateEvent(FIXTURE_IDS.eventB, FIXTURE_IDS.eventA);

    const linked = await getDuplicateLinkInfo(FIXTURE_IDS.eventB);
    expect(linked?.event.canonicalEventId).toBe(FIXTURE_IDS.eventA);
    expect(linked?.canonicalEvent?.id).toBe(FIXTURE_IDS.eventA);

    const canonicalInfo = await getDuplicateLinkInfo(FIXTURE_IDS.eventA);
    expect(canonicalInfo?.linkedDuplicates).toHaveLength(1);

    await unlinkDuplicateEvent(FIXTURE_IDS.eventB);

    const unlinked = await getDuplicateLinkInfo(FIXTURE_IDS.eventB);
    expect(unlinked?.event.canonicalEventId).toBeNull();
  });
});
