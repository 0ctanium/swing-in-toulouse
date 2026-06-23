import { describe, expect, it } from "vitest";

import {
  parseIcalLocation,
  venueSlugFromLocation,
} from "@/lib/venues/parse-location";

describe("parseIcalLocation", () => {
  it("splits name and address on the first comma", () => {
    expect(
      parseIcalLocation("Le Grand Bal, 12 rue des Filatiers, 31000 Toulouse"),
    ).toEqual({
      name: "Le Grand Bal",
      address: "12 rue des Filatiers, 31000 Toulouse",
      fullLocation: "Le Grand Bal, 12 rue des Filatiers, 31000 Toulouse",
    });
  });

  it("returns the full string as name when there is no comma", () => {
    expect(parseIcalLocation("Place du Capitole")).toEqual({
      name: "Place du Capitole",
      address: null,
      fullLocation: "Place du Capitole",
    });
  });

  it("handles empty input", () => {
    expect(parseIcalLocation("   ")).toEqual({
      name: "",
      address: null,
      fullLocation: "",
    });
  });
});

describe("venueSlugFromLocation", () => {
  it("slugifies the parsed venue name", () => {
    expect(venueSlugFromLocation("Le Grand Bal, 12 rue des Filatiers")).toBe(
      "le-grand-bal",
    );
  });
});
