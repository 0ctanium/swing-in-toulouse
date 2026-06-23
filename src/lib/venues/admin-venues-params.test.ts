import { describe, expect, it } from "vitest";

import {
  adminVenuesPendingFilterHref,
  hasAdminVenuesFilters,
} from "@/lib/venues/admin-venues-params";

describe("hasAdminVenuesFilters", () => {
  it("detects active confirmation filters", () => {
    expect(hasAdminVenuesFilters({ confirmation: null })).toBe(false);
    expect(hasAdminVenuesFilters({ confirmation: "pending" })).toBe(true);
  });
});

describe("adminVenuesPendingFilterHref", () => {
  it("returns the pending confirmation filter URL", () => {
    expect(adminVenuesPendingFilterHref()).toBe("/admin/venues?confirmation=pending");
  });
});
