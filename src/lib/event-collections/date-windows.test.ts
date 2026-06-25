import { fromZonedTime } from "date-fns-tz";
import { describe, expect, it } from "vitest";

import {
  getThisWeekendWindow,
  getTodayWindow,
} from "@/lib/event-collections/date-windows";
import { siteConfig } from "@/lib/site";

function zonedDate(isoDate: string, time = "12:00:00") {
  return fromZonedTime(`${isoDate}T${time}`, siteConfig.timezone);
}

describe("getTodayWindow", () => {
  it("covers the full site-local day", () => {
    const now = zonedDate("2026-06-15", "15:30:00");
    const window = getTodayWindow(now);

    expect(window.from).toEqual(zonedDate("2026-06-15", "00:00:00"));
    expect(window.to).toEqual(zonedDate("2026-06-15", "23:59:59.999"));
  });
});

describe("getThisWeekendWindow", () => {
  it("returns the upcoming Friday to Sunday from Monday", () => {
    const now = zonedDate("2026-06-15", "10:00:00");
    const window = getThisWeekendWindow(now);

    expect(window.from).toEqual(zonedDate("2026-06-19", "00:00:00"));
    expect(window.to).toEqual(zonedDate("2026-06-21", "23:59:59.999"));
  });

  it("returns the current weekend from Saturday", () => {
    const now = zonedDate("2026-06-20", "10:00:00");
    const window = getThisWeekendWindow(now);

    expect(window.from).toEqual(zonedDate("2026-06-19", "00:00:00"));
    expect(window.to).toEqual(zonedDate("2026-06-21", "23:59:59.999"));
  });

  it("returns the current weekend from Sunday", () => {
    const now = zonedDate("2026-06-21", "18:00:00");
    const window = getThisWeekendWindow(now);

    expect(window.from).toEqual(zonedDate("2026-06-19", "00:00:00"));
    expect(window.to).toEqual(zonedDate("2026-06-21", "23:59:59.999"));
  });
});
