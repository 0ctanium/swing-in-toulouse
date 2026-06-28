import { describe, expect, it } from "vitest";

import {
  ALL_DAY_LABEL,
  calendarDayKey,
  formatAdminEventTableDate,
  formatEventChipTime,
  formatEventDate,
  formatEventScheduleTime,
  getEventInclusiveCalendarDay,
  isAllDayEvent,
} from "@/lib/events/format";

describe("isAllDayEvent", () => {
  it("returns true when the event is explicitly all-day", () => {
    expect(
      isAllDayEvent(
        new Date("2026-03-15T10:00:00+01:00"),
        new Date("2026-03-15T12:00:00+01:00"),
        true,
      ),
    ).toBe(true);
  });

  it("detects midnight-to-midnight single-day events in site timezone", () => {
    expect(
      isAllDayEvent(
        new Date("2026-03-15T00:00:00+01:00"),
        new Date("2026-03-16T00:00:00+01:00"),
      ),
    ).toBe(true);
  });

  it("returns false for timed events", () => {
    expect(
      isAllDayEvent(
        new Date("2026-03-15T20:00:00+01:00"),
        new Date("2026-03-15T23:00:00+01:00"),
      ),
    ).toBe(false);
  });
});

describe("calendarDayKey", () => {
  it("formats dates in the site timezone", () => {
    expect(calendarDayKey(new Date("2026-03-15T23:30:00+01:00"))).toBe(
      "2026-03-15",
    );
  });
});

describe("formatEventDate", () => {
  it("formats timed events on the same day", () => {
    const label = formatEventDate(
      new Date("2026-03-15T20:00:00+01:00"),
      new Date("2026-03-15T23:00:00+01:00"),
    );

    expect(label).toContain("20:00");
    expect(label).toContain("23:00");
  });

  it("formats all-day events with the all-day label", () => {
    const label = formatEventDate(
      new Date("2026-03-15T00:00:00+01:00"),
      new Date("2026-03-16T00:00:00+01:00"),
      true,
    );

    expect(label).toContain(ALL_DAY_LABEL);
  });
});

describe("formatEventChipTime", () => {
  it("returns null for all-day events", () => {
    expect(
      formatEventChipTime(
        new Date("2026-03-15T00:00:00+01:00"),
        new Date("2026-03-16T00:00:00+01:00"),
        true,
      ),
    ).toBeNull();
  });

  it("returns the start time for timed events", () => {
    expect(
      formatEventChipTime(
        new Date("2026-03-15T20:00:00+01:00"),
        new Date("2026-03-15T23:00:00+01:00"),
      ),
    ).toBe("20:00");
  });
});

describe("formatEventScheduleTime", () => {
  it("returns a French schedule label", () => {
    expect(
      formatEventScheduleTime(
        new Date("2026-03-15T20:00:00+01:00"),
        new Date("2026-03-15T23:00:00+01:00"),
      ),
    ).toBe("De 20:00 à 23:00");
  });

  it("returns the all-day label for all-day events", () => {
    expect(
      formatEventScheduleTime(
        new Date("2026-03-15T00:00:00+01:00"),
        new Date("2026-03-16T00:00:00+01:00"),
        true,
      ),
    ).toBe(ALL_DAY_LABEL);
  });

  it("returns only the start time when endAt is missing", () => {
    expect(
      formatEventScheduleTime(new Date("2026-03-15T20:00:00+01:00"), null),
    ).toBe("20:00");
  });
});

describe("getEventInclusiveCalendarDay", () => {
  it("returns the inclusive end day for multi-day all-day events", () => {
    expect(
      getEventInclusiveCalendarDay(
        new Date("2026-03-15T00:00:00+01:00"),
        new Date("2026-03-17T00:00:00+01:00"),
      ),
    ).toBe("2026-03-16");
  });
});

describe("formatEventDate", () => {
  it("formats multi-day all-day ranges", () => {
    const label = formatEventDate(
      new Date("2026-03-15T00:00:00+01:00"),
      new Date("2026-03-17T00:00:00+01:00"),
    );

    expect(label).toContain(ALL_DAY_LABEL);
    expect(label).toContain("–");
  });

  it("formats cross-day timed events", () => {
    const label = formatEventDate(
      new Date("2026-03-15T23:00:00+01:00"),
      new Date("2026-03-16T01:00:00+01:00"),
    );

    expect(label).toContain("→");
  });

  it("returns only the start label when endAt is missing", () => {
    const label = formatEventDate(new Date("2026-03-15T20:00:00+01:00"), null);

    expect(label).toContain("20:00");
    expect(label).not.toContain("→");
  });
});

describe("formatAdminEventTableDate", () => {
  it("returns compact date and time lines for same-day events", () => {
    const formatted = formatAdminEventTableDate(
      new Date("2026-06-28T20:00:00+02:00"),
      new Date("2026-06-28T23:00:00+02:00"),
    );

    expect(formatted.dateLine).toContain("28");
    expect(formatted.timeLine).toBe("20:00 – 23:00");
  });

  it("returns the all-day label for all-day events", () => {
    const formatted = formatAdminEventTableDate(
      new Date("2026-03-15T00:00:00+01:00"),
      new Date("2026-03-16T00:00:00+01:00"),
      true,
    );

    expect(formatted.timeLine).toBe(ALL_DAY_LABEL);
  });
});
