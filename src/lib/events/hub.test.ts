import { describe, expect, it } from "vitest";

import {
  EVENTS_HUB_PAGE_SIZE,
  buildArchiveMonthPath,
  buildPaginatedPath,
  collectArchiveMonthsFromOccurrences,
  paginateItems,
  parseArchiveMonthParams,
  parsePageParam,
} from "@/lib/events/hub";

describe("parseArchiveMonthParams", () => {
  it("parses valid year and month", () => {
    expect(parseArchiveMonthParams("2026", "03")).toEqual({
      year: 2026,
      month: 3,
    });
  });

  it("rejects invalid values", () => {
    expect(parseArchiveMonthParams("2026", "13")).toBeNull();
    expect(parseArchiveMonthParams("abc", "03")).toBeNull();
  });
});

describe("buildArchiveMonthPath", () => {
  it("zero-pads the month segment", () => {
    expect(buildArchiveMonthPath(2026, 3)).toBe("/evenements/2026/03");
  });
});

describe("paginateItems", () => {
  const items = Array.from({ length: 35 }, (_, index) => index + 1);

  it("paginates with a safe page number", () => {
    const page = paginateItems(items, 2, EVENTS_HUB_PAGE_SIZE);

    expect(page.page).toBe(2);
    expect(page.totalPages).toBe(2);
    expect(page.items).toHaveLength(5);
    expect(page.items[0]).toBe(31);
  });

  it("clamps out-of-range pages", () => {
    expect(paginateItems(items, 99, EVENTS_HUB_PAGE_SIZE).page).toBe(2);
    expect(paginateItems(items, 0, EVENTS_HUB_PAGE_SIZE).page).toBe(1);
  });
});

describe("buildPaginatedPath", () => {
  it("omits page=1 and appends later pages", () => {
    expect(buildPaginatedPath("/evenements", 1)).toBe("/evenements");
    expect(buildPaginatedPath("/evenements", 2)).toBe("/evenements?page=2");
    expect(buildPaginatedPath("/evenements?foo=bar", 2)).toBe(
      "/evenements?foo=bar&page=2",
    );
  });
});

describe("parsePageParam", () => {
  it("parses positive integers and falls back to 1", () => {
    expect(parsePageParam("3")).toBe(3);
    expect(parsePageParam(["4"])).toBe(4);
    expect(parsePageParam("abc")).toBe(1);
    expect(parsePageParam(undefined)).toBe(1);
  });
});

describe("collectArchiveMonthsFromOccurrences", () => {
  it("collects unique months before a cutoff, newest first", () => {
    const before = new Date("2026-04-01T00:00:00+02:00");
    const months = collectArchiveMonthsFromOccurrences(
      [
        { startAt: new Date("2026-02-10T20:00:00+01:00") },
        { startAt: new Date("2026-01-15T20:00:00+01:00") },
        { startAt: new Date("2026-02-20T20:00:00+01:00") },
        { startAt: new Date("2026-05-01T20:00:00+02:00") },
      ],
      before,
    );

    expect(months).toEqual([
      { year: 2026, month: 2, key: "2026-02" },
      { year: 2026, month: 1, key: "2026-01" },
    ]);
  });
});
