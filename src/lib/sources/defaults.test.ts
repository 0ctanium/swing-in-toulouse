import { describe, expect, it } from "vitest";

import {
  formatVenueAsDefaultLocation,
  resolveSyncedCategories,
  resolveSyncedCategoriesForUpsert,
  resolveSyncedLocation,
  resolveSyncedLocationForUpsert,
} from "@/lib/sources/defaults";

const source = {
  id: "source-a",
  defaultLocationRaw: "Salle Municipale, Toulouse",
  defaultCategories: ["lindy", "blues"],
};

describe("resolveSyncedLocation", () => {
  it("prefers iCal location over source default", () => {
    expect(resolveSyncedLocation(source, { location: " Le Grand Bal " })).toBe(
      "Le Grand Bal",
    );
  });

  it("falls back to the source default location", () => {
    expect(resolveSyncedLocation(source, { location: "  " })).toBe(
      "Salle Municipale, Toulouse",
    );
  });
});

describe("resolveSyncedCategories", () => {
  it("prefers iCal categories over source defaults", () => {
    expect(
      resolveSyncedCategories(source, { categories: [" balboa "] }),
    ).toEqual(["balboa"]);
  });

  it("falls back to source default categories", () => {
    expect(resolveSyncedCategories(source, { categories: [] })).toEqual([
      "lindy",
      "blues",
    ]);
  });
});

describe("resolveSyncedCategoriesForUpsert", () => {
  it("keeps existing categories when the event belongs to another source", () => {
    expect(
      resolveSyncedCategoriesForUpsert(
        source,
        { categories: ["balboa"] },
        { sourceId: "other-source", categories: ["lindy"] },
      ),
    ).toEqual(["lindy"]);
  });
});

describe("resolveSyncedLocationForUpsert", () => {
  it("keeps existing location when the event belongs to another source", () => {
    expect(
      resolveSyncedLocationForUpsert(
        source,
        {},
        { sourceId: "other-source", locationRaw: "Existing venue" },
      ),
    ).toBe("Existing venue");
  });
});

describe("formatVenueAsDefaultLocation", () => {
  it("combines venue name and address when both are present", () => {
    expect(
      formatVenueAsDefaultLocation({
        name: "Le Grand Bal",
        address: "12 rue du Swing",
      }),
    ).toBe("Le Grand Bal, 12 rue du Swing");
  });

  it("returns only the venue name when no address is available", () => {
    expect(formatVenueAsDefaultLocation({ name: " Le Grand Bal " })).toBe(
      "Le Grand Bal",
    );
  });
});
