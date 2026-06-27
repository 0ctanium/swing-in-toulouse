import { describe, expect, it } from "vitest";

import { buildVenueMatchCandidates } from "@/lib/venues/match-candidates";

describe("buildVenueMatchCandidates", () => {
  it("groups alias names under the canonical venue id", () => {
    expect(
      buildVenueMatchCandidates([
        {
          id: "canonical",
          name: "Le Grand Bal",
          canonicalVenueId: null,
        },
        {
          id: "alias",
          name: "Grand Bal",
          canonicalVenueId: "canonical",
        },
      ]),
    ).toEqual([
      {
        id: "canonical",
        names: ["Le Grand Bal", "Grand Bal"],
      },
    ]);
  });
});
