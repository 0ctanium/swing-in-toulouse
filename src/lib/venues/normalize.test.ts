import { describe, expect, it } from "vitest";

import {
  distanceMeters,
  extractPostcode,
  fuzzyAddressSimilar,
  namesSimilar,
  normalizeLabel,
  normalizeStreetTokens,
  streetPostcodeKey,
} from "@/lib/venues/normalize";

describe("normalizeLabel", () => {
  it("strips accents and lowercases", () => {
    expect(normalizeLabel("Café Étoile")).toBe("cafe etoile");
  });

  it("collapses punctuation to spaces", () => {
    expect(normalizeLabel("Le Swing-Bar!")).toBe("le swing bar");
  });
});

describe("normalizeStreetTokens", () => {
  it("expands common French street abbreviations", () => {
    expect(normalizeStreetTokens("12 Av. de la République")).toBe(
      "12 avenue de la republique",
    );
  });
});

describe("extractPostcode", () => {
  it("returns a 5-digit French postcode", () => {
    expect(extractPostcode("31000 Toulouse")).toBe("31000");
  });

  it("returns null for missing values", () => {
    expect(extractPostcode(null)).toBeNull();
    expect(extractPostcode("  ")).toBeNull();
  });
});

describe("streetPostcodeKey", () => {
  it("builds a street and postcode fingerprint", () => {
    const key = streetPostcodeKey(
      "Le Grand Bal",
      "12 rue des Filatiers, 31000 Toulouse",
    );

    expect(key).toContain("31000");
    expect(key).toContain("rue des filatiers");
  });

  it("returns null for empty input", () => {
    expect(streetPostcodeKey()).toBeNull();
  });
});

describe("namesSimilar", () => {
  it("matches identical normalized names", () => {
    expect(namesSimilar("Le Grand Bal", "le grand bal")).toBe(true);
  });

  it("matches when one name contains the other", () => {
    expect(namesSimilar("Grand Bal", "Le Grand Bal Toulouse")).toBe(true);
  });

  it("rejects very short partial matches", () => {
    expect(namesSimilar("Bal", "Le Grand Bal Toulouse")).toBe(false);
  });
});

describe("fuzzyAddressSimilar", () => {
  it("matches addresses with equivalent abbreviations", () => {
    expect(
      fuzzyAddressSimilar(
        "12 av de la république 31000 toulouse",
        "12 avenue de la republique 31000 toulouse france",
      ),
    ).toBe(true);
  });

  it("rejects short addresses", () => {
    expect(fuzzyAddressSimilar("rue x", "rue y")).toBe(false);
  });
});

describe("distanceMeters", () => {
  it("returns zero for identical coordinates", () => {
    expect(distanceMeters(43.6047, 1.4442, 43.6047, 1.4442)).toBe(0);
  });

  it("returns a positive distance for distinct points", () => {
    const distance = distanceMeters(43.6047, 1.4442, 48.8566, 2.3522);
    expect(distance).toBeGreaterThan(500_000);
    expect(distance).toBeLessThan(700_000);
  });
});
