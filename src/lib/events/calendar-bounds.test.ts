import { fromZonedTime } from "date-fns-tz";
import { afterEach, describe, expect, it } from "vitest";

import {
  getAgendaCalendarAnchor,
  getFourWeekGridBounds,
  getMonthGridBounds,
} from "@/lib/events/calendar";
import { siteConfig } from "@/lib/site";

function zonedDate(isoDate: string, time = "12:00:00") {
  return fromZonedTime(`${isoDate}T${time}`, siteConfig.timezone);
}

describe("calendar grid bounds", () => {
  const originalTz = process.env.TZ;

  afterEach(() => {
    if (originalTz === undefined) {
      delete process.env.TZ;
    } else {
      process.env.TZ = originalTz;
    }
  });

  it("returns site-timezone UTC instants for the month grid when process runs in UTC", () => {
    process.env.TZ = "UTC";

    const anchor = getAgendaCalendarAnchor(zonedDate("2026-06-15"));
    const bounds = getMonthGridBounds(anchor);

    expect(bounds.from.toISOString()).toBe("2026-05-31T22:00:00.000Z");
    expect(bounds.to.toISOString()).toBe("2026-07-05T21:59:59.999Z");
  });

  it("returns site-timezone UTC instants for the four-week grid when process runs in UTC", () => {
    process.env.TZ = "UTC";

    const anchor = getAgendaCalendarAnchor(zonedDate("2026-06-15"));
    const bounds = getFourWeekGridBounds(anchor);

    expect(bounds.from.toISOString()).toBe("2026-06-14T22:00:00.000Z");
    expect(bounds.to.toISOString()).toBe("2026-07-12T21:59:59.999Z");
  });
});
