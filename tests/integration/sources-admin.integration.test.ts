import { beforeEach, describe, expect, it } from "vitest";

import { listAdminSources, resolveUniqueSourceSlug } from "@/lib/sources/admin";

import { FIXTURE_IDS } from "../helpers/seed";
import { seedLibIntegrationFixtures } from "../helpers/seed-lib";
import {
  resetIntegrationDb,
  setupIntegrationDb,
} from "../helpers/setup-integration-db";

describe("sources admin", () => {
  beforeEach(async () => {
    await resetIntegrationDb();
    await seedLibIntegrationFixtures(await setupIntegrationDb());
  });

  it("lists all sources for platform admins", async () => {
    const sources = await listAdminSources({ mode: "all" });

    expect(sources).toHaveLength(2);
    expect(sources.find((source) => source.id === FIXTURE_IDS.sourceA)?.eventCount).toBe(
      2,
    );
  });

  it("scopes sources to the active organization", async () => {
    const sources = await listAdminSources({
      mode: "org",
      organizationId: FIXTURE_IDS.orgA,
    });

    expect(sources).toHaveLength(1);
    expect(sources[0]?.id).toBe(FIXTURE_IDS.sourceA);
    expect(sources[0]?.organizationSlug).toBe("swing-club-a");
  });

  it("resolves unique source slugs", async () => {
    await expect(resolveUniqueSourceSlug("agenda-a")).resolves.toBe("agenda-a-2");
    await expect(
      resolveUniqueSourceSlug("agenda-a", FIXTURE_IDS.sourceA),
    ).resolves.toBe("agenda-a");
  });
});
