import { describe, expect, it } from "vitest";

import {
  DEFAULT_ADMIN_EVENT_VIEW,
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
      search: "",
      view: DEFAULT_ADMIN_EVENT_VIEW,
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
        search: "  swing session  ",
        view: "pending",
      }),
    ).toEqual({
      page: 2,
      sort: "title",
      dir: "desc",
      venue: ["le-grand-bal", "salle-x"],
      org: ["swing-club-a", "swing-club-b"],
      category: ["lindy"],
      state: ["pending", "confirmed"],
      search: "swing session",
      view: "pending",
    });
  });

  it("ignores invalid sort and page values", () => {
    expect(
      parseAdminEventsSearchParams({
        page: "0",
        sort: "unknown",
        dir: "sideways",
        view: "invalid",
      }),
    ).toEqual({
      page: 1,
      sort: null,
      dir: "asc",
      venue: [],
      org: [],
      category: [],
      state: [],
      search: "",
      view: DEFAULT_ADMIN_EVENT_VIEW,
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
        search: "",
        view: DEFAULT_ADMIN_EVENT_VIEW,
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
        search: "",
        view: DEFAULT_ADMIN_EVENT_VIEW,
      }),
    ).toBe(true);

    expect(
      hasAdminEventsFilters({
        page: 1,
        sort: null,
        dir: "asc",
        venue: [],
        org: [],
        category: [],
        state: [],
        search: "bal",
        view: DEFAULT_ADMIN_EVENT_VIEW,
      }),
    ).toBe(true);

    expect(
      hasAdminEventsFilters({
        page: 1,
        sort: null,
        dir: "asc",
        venue: [],
        org: [],
        category: [],
        state: [],
        search: "",
        view: "all",
      }),
    ).toBe(true);
  });
});
