import { describe, expect, it } from "vitest";

import {
  hasAdminEventsFilters,
  parseAdminEventsSearchParams,
} from "@/lib/events/admin-events-params";

describe("parseAdminEventsSearchParams", () => {
  it("returns defaults for empty params", () => {
    expect(parseAdminEventsSearchParams({})).toEqual({
      page: 1,
      sort: null,
      dir: "asc",
      venue: [],
      org: [],
      category: [],
      state: [],
    });
  });

  it("parses filters and pagination", () => {
    expect(
      parseAdminEventsSearchParams({
        page: "2",
        sort: "title",
        dir: "desc",
        venue: ["le-grand-bal", "salle-x"],
        org: "swing-club-a,swing-club-b",
        category: "lindy",
        state: ["pending", "confirmed", "invalid"],
      }),
    ).toEqual({
      page: 2,
      sort: "title",
      dir: "desc",
      venue: ["le-grand-bal", "salle-x"],
      org: ["swing-club-a", "swing-club-b"],
      category: ["lindy"],
      state: ["pending", "confirmed"],
    });
  });

  it("ignores invalid sort and page values", () => {
    expect(
      parseAdminEventsSearchParams({
        page: "0",
        sort: "unknown",
        dir: "sideways",
      }),
    ).toEqual({
      page: 1,
      sort: null,
      dir: "asc",
      venue: [],
      org: [],
      category: [],
      state: [],
    });
  });
});

describe("hasAdminEventsFilters", () => {
  it("detects active filters", () => {
    expect(
      hasAdminEventsFilters({
        page: 1,
        sort: null,
        dir: "asc",
        venue: [],
        org: [],
        category: [],
        state: [],
      }),
    ).toBe(false);

    expect(
      hasAdminEventsFilters({
        page: 1,
        sort: null,
        dir: "asc",
        venue: ["le-grand-bal"],
        org: [],
        category: [],
        state: [],
      }),
    ).toBe(true);
  });
});
