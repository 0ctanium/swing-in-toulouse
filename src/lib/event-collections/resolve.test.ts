import { describe, expect, it } from "vitest";

import { collectionPageDescription } from "@/lib/event-collections/metadata";
import { resolveEvenementsCollectionSlug } from "@/lib/event-collections/resolve";
import { getTimePresetCollection } from "@/lib/event-collections/time-presets";

describe("resolveEvenementsCollectionSlug", () => {
  it("resolves known time presets", async () => {
    const collection = await resolveEvenementsCollectionSlug("aujourd-hui");

    expect(collection).toEqual(
      expect.objectContaining({
        kind: "time-preset",
        slug: "aujourd-hui",
        path: "/evenements/aujourd-hui",
      }),
    );
  });
});

describe("getTimePresetCollection", () => {
  it("includes date filters", () => {
    const collection = getTimePresetCollection("ce-week-end");

    expect(collection?.filters.from).toBeInstanceOf(Date);
    expect(collection?.filters.to).toBeInstanceOf(Date);
    expect(collection?.filters.categoryName).toBeUndefined();
  });
});

describe("collectionPageDescription", () => {
  it("falls back for event-type tags", () => {
    expect(
      collectionPageDescription({
        kind: "tag",
        tagType: "evenement",
        label: "Festival",
        seoDescription: null,
        description: null,
      }),
    ).toContain("Festival");
  });
});
