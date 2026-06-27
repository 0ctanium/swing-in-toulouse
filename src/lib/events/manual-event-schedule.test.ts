import { describe, expect, it } from "vitest";

import {
  buildScheduleIso,
  defaultEventScheduleValue,
  scheduleValueFromEvent,
} from "@/lib/events/manual-event-schedule";

describe("buildScheduleIso", () => {
  it("builds timed events in Europe/Paris", () => {
    const result = buildScheduleIso({
      isAllDay: false,
      startDate: "2026-07-01",
      startTime: "20:00",
      endDate: "2026-07-01",
      endTime: "23:00",
    });

    expect(result.isAllDay).toBe(false);
    expect(result.startAt).toBe("2026-07-01T18:00:00.000Z");
    expect(result.endAt).toBe("2026-07-01T21:00:00.000Z");
  });

  it("builds single-day all-day events with exclusive end", () => {
    const result = buildScheduleIso({
      isAllDay: true,
      startDate: "2026-07-01",
      startTime: "00:00",
      endDate: "2026-07-01",
      endTime: "00:00",
    });

    expect(result.isAllDay).toBe(true);
    expect(result.startAt).toBe("2026-06-30T22:00:00.000Z");
    expect(result.endAt).toBe("2026-07-01T22:00:00.000Z");
  });

  it("rejects end before start for timed events", () => {
    expect(() =>
      buildScheduleIso({
        isAllDay: false,
        startDate: "2026-07-01",
        startTime: "22:00",
        endDate: "2026-07-01",
        endTime: "20:00",
      }),
    ).toThrow("La fin doit être postérieure au début.");
  });
});

describe("scheduleValueFromEvent", () => {
  it("round-trips timed events through buildScheduleIso", () => {
    const initial = defaultEventScheduleValue(
      new Date("2026-07-01T12:00:00.000Z"),
    );
    initial.startTime = "20:30";
    initial.endTime = "23:15";

    const iso = buildScheduleIso(initial);
    const restored = scheduleValueFromEvent({
      startAt: new Date(iso.startAt),
      endAt: iso.endAt ? new Date(iso.endAt) : null,
      isAllDay: iso.isAllDay,
    });

    expect(restored).toEqual(initial);
  });

  it("round-trips all-day events through buildScheduleIso", () => {
    const initial = {
      isAllDay: true,
      startDate: "2026-07-01",
      startTime: "00:00",
      endDate: "2026-07-02",
      endTime: "00:00",
    };

    const iso = buildScheduleIso(initial);
    const restored = scheduleValueFromEvent({
      startAt: new Date(iso.startAt),
      endAt: iso.endAt ? new Date(iso.endAt) : null,
      isAllDay: iso.isAllDay,
    });

    expect(restored).toEqual(initial);
  });
});

describe("defaultEventScheduleValue", () => {
  it("defaults to the same day for start and end", () => {
    const value = defaultEventScheduleValue(new Date("2026-07-01T10:00:00.000Z"));

    expect(value.startDate).toBe("2026-07-01");
    expect(value.endDate).toBe("2026-07-01");
    expect(value.isAllDay).toBe(false);
  });
});
