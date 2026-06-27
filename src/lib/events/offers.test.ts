import { describe, expect, it } from "vitest";

import {
  buildOffersOverridePatch,
  offersEqual,
  parseOfferDrafts,
  resolveOffersFormState,
  resolveOffersMode,
} from "@/lib/events/offers";

describe("resolveOffersMode", () => {
  it("returns unset for null offers", () => {
    expect(resolveOffersMode(null)).toBe("unset");
    expect(resolveOffersMode(undefined)).toBe("unset");
  });

  it("detects free, single, and multiple modes", () => {
    expect(
      resolveOffersMode([{ label: "Entrée", price: 0, currency: "EUR" }]),
    ).toBe("free");
    expect(
      resolveOffersMode([{ label: "Entrée", price: 12, currency: "EUR" }]),
    ).toBe("single");
    expect(
      resolveOffersMode([
        { label: "1h", price: 75, currency: "EUR" },
        { label: "2h", price: 100, currency: "EUR" },
      ]),
    ).toBe("multiple");
  });
});

describe("parseOfferDrafts", () => {
  it("parses comma decimal prices", () => {
    expect(
      parseOfferDrafts("single", [{ label: "Entrée", price: "12,50", url: "" }]),
    ).toEqual([{ label: "Entrée", price: 12.5, currency: "EUR" }]);
  });
});

describe("buildOffersOverridePatch", () => {
  it("clears offers when switching to N/D after an override", () => {
    expect(
      buildOffersOverridePatch({
        mode: "unset",
        rows: [],
        syncedOffers: null,
        currentPatchOffers: [{ label: "Entrée", price: 12, currency: "EUR" }],
      }),
    ).toEqual({ offers: null });
  });

  it("skips patch when N/D and no prior override", () => {
    expect(
      buildOffersOverridePatch({
        mode: "unset",
        rows: [],
        syncedOffers: null,
        currentPatchOffers: undefined,
      }),
    ).toEqual({});
  });

  it("stores free and paid offers", () => {
    expect(
      buildOffersOverridePatch({
        mode: "free",
        rows: [],
        syncedOffers: null,
        currentPatchOffers: undefined,
      }),
    ).toEqual({
      offers: [{ label: "Entrée", price: 0, currency: "EUR" }],
    });
  });
});

describe("resolveOffersFormState", () => {
  it("prefers patch offers over synced values", () => {
    expect(
      resolveOffersFormState({
        currentPatchOffers: [{ label: "Entrée", price: 15, currency: "EUR" }],
        syncedOffers: null,
      }).mode,
    ).toBe("single");
  });
});

describe("offersEqual", () => {
  it("compares normalized offer arrays", () => {
    expect(
      offersEqual(
        [{ label: "Entrée", price: 12, currency: "EUR" }],
        [{ label: "Entrée", price: 12, currency: "EUR" }],
      ),
    ).toBe(true);
  });
});
