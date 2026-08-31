import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
}));

import { revalidateTag } from "next/cache";

import {
  invalidatePublicCacheForChangedEvents,
  sourceSyncHasPublicChanges,
} from "@/lib/cache/invalidate";
import {
  CACHE_TAGS,
  eventSlugCacheTag,
  relatedEventsCacheTag,
} from "@/lib/cache/tags";

describe("sourceSyncHasPublicChanges", () => {
  it("is false when the feed only reported unchanged events", () => {
    expect(
      sourceSyncHasPublicChanges({ created: 0, updated: 0, cancelled: 0 }),
    ).toBe(false);
  });

  it("is true when any event was created, updated, or cancelled", () => {
    expect(
      sourceSyncHasPublicChanges({ created: 1, updated: 0, cancelled: 0 }),
    ).toBe(true);
    expect(
      sourceSyncHasPublicChanges({ created: 0, updated: 2, cancelled: 0 }),
    ).toBe(true);
    expect(
      sourceSyncHasPublicChanges({ created: 0, updated: 0, cancelled: 1 }),
    ).toBe(true);
  });
});

describe("invalidatePublicCacheForChangedEvents", () => {
  beforeEach(() => {
    vi.mocked(revalidateTag).mockClear();
  });

  it("does nothing when no slugs changed", () => {
    invalidatePublicCacheForChangedEvents([]);
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("revalidates listings and only the changed event slugs", () => {
    invalidatePublicCacheForChangedEvents(["bal-lindy", "bal-blues"]);

    expect(revalidateTag).toHaveBeenCalledWith(CACHE_TAGS.events, "max");
    expect(revalidateTag).toHaveBeenCalledWith(CACHE_TAGS.agendaFilters, "max");
    expect(revalidateTag).toHaveBeenCalledWith(
      eventSlugCacheTag("bal-lindy"),
      "max",
    );
    expect(revalidateTag).toHaveBeenCalledWith(
      relatedEventsCacheTag("bal-lindy"),
      "max",
    );
    expect(revalidateTag).toHaveBeenCalledWith(
      eventSlugCacheTag("bal-blues"),
      "max",
    );
    expect(revalidateTag).not.toHaveBeenCalledWith(
      CACHE_TAGS.organizers,
      "max",
    );
    expect(revalidateTag).not.toHaveBeenCalledWith(CACHE_TAGS.venues, "max");
    expect(revalidateTag).not.toHaveBeenCalledWith(
      CACHE_TAGS.categoryTags,
      "max",
    );
  });
});
