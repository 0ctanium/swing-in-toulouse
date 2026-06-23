import { describe, expect, it } from "vitest";

import { buildAdminMetaForOccurrences } from "@/lib/events/admin-meta";
import { buildOverrideIndex } from "@/lib/events/overrides";

describe("buildAdminMetaForOccurrences", () => {
  it("marks master and occurrence overrides separately", () => {
    const occurrenceStartAt = new Date("2026-06-20T18:00:00.000Z");
    const overrides = buildOverrideIndex([
      {
        id: "override-1",
        eventId: "master-1",
        occurrenceStartAt: null,
        patch: { title: "Overridden title" },
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "override-2",
        eventId: "master-1",
        occurrenceStartAt,
        patch: { hidden: true },
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const meta = buildAdminMetaForOccurrences(
      [
        {
          id: "occurrence-1",
          masterEventId: "master-1",
          startAt: occurrenceStartAt,
        },
      ],
      overrides,
    );

    expect(meta.get("occurrence-1")).toEqual({
      masterOverridden: true,
      occurrenceOverridden: true,
      overrideCount: 2,
    });
  });
});
