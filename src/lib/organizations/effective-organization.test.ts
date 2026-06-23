import { describe, expect, it } from "vitest";

import {
  effectiveOrganizationIdForEvent,
  filterOccurrencesForOrganization,
} from "@/lib/organizations/effective-organization";

describe("effectiveOrganizationIdForEvent", () => {
  it("returns the override organization id when present", () => {
    const overrides = new Map<string, string | null>([
      ["event-1", "org-override"],
    ]);

    expect(
      effectiveOrganizationIdForEvent(
        { id: "event-1", organizationId: "org-source" },
        overrides,
      ),
    ).toBe("org-override");
  });

  it("returns null when the override clears the organization", () => {
    const overrides = new Map<string, string | null>([["event-1", null]]);

    expect(
      effectiveOrganizationIdForEvent(
        { id: "event-1", organizationId: "org-source" },
        overrides,
      ),
    ).toBeNull();
  });

  it("falls back to the event organization id", () => {
    expect(
      effectiveOrganizationIdForEvent(
        { id: "event-1", organizationId: "org-source" },
        new Map(),
      ),
    ).toBe("org-source");
  });
});

describe("filterOccurrencesForOrganization", () => {
  it("keeps only occurrences for the requested organization", () => {
    const occurrences = [
      { organization: { id: "org-a" } },
      { organization: { id: "org-b" } },
      { organization: null },
    ] as never[];

    expect(filterOccurrencesForOrganization(occurrences, "org-a")).toHaveLength(1);
  });
});
