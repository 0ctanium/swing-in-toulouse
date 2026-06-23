import { describe, expect, it } from "vitest";

import {
  buildVenueCanonicalMap,
  resolveCanonicalVenueId,
  VenueCanonicalError,
} from "@/lib/venues/canonical";

describe("buildVenueCanonicalMap", () => {
  it("resolves a single alias to its canonical venue", () => {
    const map = buildVenueCanonicalMap([
      { id: "canonical", canonicalVenueId: null },
      { id: "alias", canonicalVenueId: "canonical" },
    ]);

    expect(resolveCanonicalVenueId("alias", map)).toBe("canonical");
    expect(resolveCanonicalVenueId("canonical", map)).toBe("canonical");
  });

  it("follows chained aliases to the root venue", () => {
    const map = buildVenueCanonicalMap([
      { id: "root", canonicalVenueId: null },
      { id: "middle", canonicalVenueId: "root" },
      { id: "alias", canonicalVenueId: "middle" },
    ]);

    expect(resolveCanonicalVenueId("alias", map)).toBe("root");
  });

  it("throws when a circular redirect is detected", () => {
    const map = buildVenueCanonicalMap([
      { id: "a", canonicalVenueId: "b" },
      { id: "b", canonicalVenueId: "a" },
    ]);

    expect(() => resolveCanonicalVenueId("a", map)).toThrow(VenueCanonicalError);
  });
});

describe("VenueCanonicalError", () => {
  it("is a named error", () => {
    const error = new VenueCanonicalError("Test");
    expect(error.name).toBe("VenueCanonicalError");
  });
});
