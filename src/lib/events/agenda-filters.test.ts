import { describe, expect, it } from "vitest";

import {
  applyAgendaFilterPatch,
  isFilterDimensionLocked,
  mergeAgendaFilters,
} from "@/lib/events/agenda-filters";
import { buildEmbedAgendaBaseFilters } from "@/lib/integrations/base-filters";

describe("mergeAgendaFilters", () => {
  it("forces base filter values over user filters", () => {
    expect(
      mergeAgendaFilters(
        { category: ["soiree"], venue: ["le-bal"], org: ["other"] },
        { category: ["cours"], org: ["trac"] },
      ),
    ).toEqual({
      category: ["cours"],
      venue: ["le-bal"],
      org: ["trac"],
    });
  });
});

describe("applyAgendaFilterPatch", () => {
  it("reapplies base filters after user changes", () => {
    expect(
      applyAgendaFilterPatch(
        { category: [], venue: [], org: [] },
        { org: ["other"] },
        { org: ["trac"] },
      ),
    ).toEqual({
      category: [],
      venue: [],
      org: ["trac"],
    });
  });
});

describe("isFilterDimensionLocked", () => {
  it("locks only non-empty base dimensions", () => {
    expect(isFilterDimensionLocked("org", { org: ["trac"] })).toBe(true);
    expect(isFilterDimensionLocked("venue", { org: ["trac"] })).toBe(false);
    expect(isFilterDimensionLocked("category", { category: [] })).toBe(false);
  });
});

describe("buildEmbedAgendaBaseFilters", () => {
  it("always overrides org with the owner organization", () => {
    expect(
      buildEmbedAgendaBaseFilters({
        organizationSlug: "trac",
        integrationBaseFilters: {
          category: ["cours"],
          org: ["other"],
        },
      }),
    ).toEqual({
      category: ["cours"],
      org: ["trac"],
    });
  });
});
