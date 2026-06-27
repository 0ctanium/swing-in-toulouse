import { describe, expect, it } from "vitest";

import {
  buildMasterOverridePatch,
  hasMasterOverrideChangesFromForm,
  hasReviewableMasterChanges,
} from "@/lib/events/override-patch";

const synced = {
  title: "Soirée Lindy",
  description: "Bal swing",
  organizationId: "22222222-2222-4222-8222-222222222222",
  venueId: "11111111-1111-4111-8111-111111111111",
  categories: ["lindy", "balboa"],
  status: "published" as const,
  sourceUrl: "https://example.com/event",
  offers: null,
};

const baseForm = {
  title: "Soirée Lindy",
  description: "Bal swing",
  organizationId: "22222222-2222-4222-8222-222222222222",
  venueId: "11111111-1111-4111-8111-111111111111",
  categories: ["lindy", "balboa"],
  status: "published" as const,
  sourceUrl: "https://example.com/event",
  notes: "",
  offersMode: "unset" as const,
  offerRows: [{ label: "Entrée", price: "" }],
};

describe("buildMasterOverridePatch", () => {
  it("returns an empty patch when the form matches synced data", () => {
    expect(buildMasterOverridePatch(baseForm, synced)).toEqual({});
  });

  it("includes only changed fields", () => {
    expect(
      buildMasterOverridePatch(
        { ...baseForm, title: "Bal Blues", status: "cancelled" },
        synced,
      ),
    ).toEqual({
      title: "Bal Blues",
      status: "cancelled",
    });
  });

  it("normalizes empty text fields to null", () => {
    expect(
      buildMasterOverridePatch({ ...baseForm, description: "   " }, synced),
    ).toEqual({
      description: null,
    });
  });

  it("stores notes without counting them as reviewable changes", () => {
    const patch = buildMasterOverridePatch(
      { ...baseForm, notes: "Vérifier l'horaire" },
      synced,
    );

    expect(patch).toEqual({ notes: "Vérifier l'horaire" });
    expect(hasReviewableMasterChanges(patch)).toBe(false);
  });
});

describe("hasMasterOverrideChangesFromForm", () => {
  it("detects reviewable form changes", () => {
    expect(hasMasterOverrideChangesFromForm(baseForm, synced)).toBe(false);
    expect(
      hasMasterOverrideChangesFromForm(
        { ...baseForm, categories: ["blues"] },
        synced,
      ),
    ).toBe(true);
  });
});
