import { describe, expect, it } from "vitest";

import {
  resolveCollectionHeroTitle,
} from "@/lib/event-collections/metadata";

describe("resolveCollectionHeroTitle", () => {
  it("uses evenement defaults when hero fields are unset", () => {
    expect(
      resolveCollectionHeroTitle({
        kind: "tag",
        tagType: "evenement",
        label: "Festival",
        heroTitleBefore: null,
        heroTitleEmphasis: null,
        heroTitleAfter: null,
      }),
    ).toEqual({
      before: "",
      emphasis: "Festival",
      after: "swing à Toulouse",
    });
  });

  it("honors a customized empty before segment", () => {
    expect(
      resolveCollectionHeroTitle({
        kind: "tag",
        tagType: "evenement",
        label: "Festival",
        heroTitleBefore: "",
        heroTitleEmphasis: "Festival",
        heroTitleAfter: "swing à Toulouse",
      }),
    ).toEqual({
      before: "",
      emphasis: "Festival",
      after: "swing à Toulouse",
    });
  });
});
