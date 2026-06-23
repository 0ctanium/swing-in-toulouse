import { beforeEach, describe, expect, it } from "vitest";

import {
  listAdminCategoryTags,
  updateCategoryTag,
} from "@/lib/event-category-tags/admin";
import { collectDistinctEventCategoryTagNames } from "@/lib/event-category-tags/collect";

import { seedLibIntegrationFixtures } from "../helpers/seed-lib";
import {
  resetIntegrationDb,
  setupIntegrationDb,
} from "../helpers/setup-integration-db";

describe("category tags admin", () => {
  beforeEach(async () => {
    await resetIntegrationDb();
    await seedLibIntegrationFixtures(await setupIntegrationDb());
  });

  it("collects distinct category names from events and sources", async () => {
    const names = await collectDistinctEventCategoryTagNames();

    expect(names).toEqual(
      expect.arrayContaining(["lindy", "soiree", "blues"]),
    );
  });

  it("lists admin category tags with metadata", async () => {
    const result = await listAdminCategoryTags({ search: "lindy" });

    expect(result.rows).toHaveLength(1);
    expect(result.rows[0]).toEqual(
      expect.objectContaining({
        name: "lindy",
        tagType: "danse",
        hasMetadata: true,
        slug: "lindy-hop",
      }),
    );
  });

  it("updates category tag metadata", async () => {
    const updated = await updateCategoryTag("lindy", {
      subtitle: "Soirées Lindy Hop",
      isPublished: true,
    });

    expect(updated.subtitle).toBe("Soirées Lindy Hop");
    expect(updated.isPublished).toBe(true);
  });
});
