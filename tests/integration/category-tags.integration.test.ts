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

  it("allows publishing evenement tags", async () => {
    const updated = await updateCategoryTag("soiree", {
      tagType: "evenement",
      slug: "festivals",
      isPublished: true,
    });

    expect(updated.tagType).toBe("evenement");
    expect(updated.isPublished).toBe(true);
    expect(updated.slug).toBe("festivals");
  });

  it("rejects reserved time preset slugs", async () => {
    await expect(
      updateCategoryTag("soiree", {
        tagType: "evenement",
        slug: "aujourd-hui",
        isPublished: true,
      }),
    ).rejects.toThrow(/réservé/i);
  });

  it("updates category tag aliases", async () => {
    const updated = await updateCategoryTag("lindy", {
      aliases: ["Atelier", "Workshop"],
    });

    expect(updated.aliases).toEqual(["Atelier", "Workshop"]);
  });

  it("rejects aliases that match another tag name", async () => {
    await expect(
      updateCategoryTag("lindy", { aliases: ["soiree"] }),
    ).rejects.toThrow(/déjà un tag/i);
  });

  it("rejects aliases already used by another tag", async () => {
    await updateCategoryTag("soiree", { aliases: ["festin"] });

    await expect(
      updateCategoryTag("lindy", { aliases: ["festin"] }),
    ).rejects.toThrow(/déjà un alias/i);
  });

  it("returns null for unknown public slugs", async () => {
    const { resolveEvenementsCollectionSlug } = await import(
      "@/lib/event-collections/resolve"
    );

    await expect(resolveEvenementsCollectionSlug("inconnu")).resolves.toBeNull();
  });
});
