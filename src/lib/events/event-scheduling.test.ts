import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getEventDisplayDate,
  getEventScheduling,
  sortEventsForAdmin,
} from "@/lib/events/event-scheduling";

const today = new Date("2026-06-10T00:00:00.000Z");

describe("getEventScheduling", () => {
  it("marks non-recurring past events as not upcoming", () => {
    const result = getEventScheduling(
      {
        id: "past",
        startAt: new Date("2026-05-01T20:00:00.000Z"),
        endAt: new Date("2026-05-01T23:00:00.000Z"),
        recurrenceRule: null,
      },
      today,
      new Map(),
    );

    expect(result.isUpcoming).toBe(false);
    expect(result.sortAt).toEqual(new Date("2026-05-01T20:00:00.000Z"));
  });

  it("uses the next occurrence for recurring events", () => {
    const nextOccurrence = new Date("2026-07-01T20:00:00.000Z");

    const result = getEventScheduling(
      {
        id: "recurring",
        startAt: new Date("2026-01-01T20:00:00.000Z"),
        endAt: new Date("2026-01-01T23:00:00.000Z"),
        recurrenceRule: "FREQ=WEEKLY",
      },
      today,
      new Map([["recurring", nextOccurrence]]),
    );

    expect(result.isUpcoming).toBe(true);
    expect(result.sortAt).toEqual(nextOccurrence);
  });
});

describe("sortEventsForAdmin", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("sorts upcoming events ascending and past events descending", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-10T12:00:00.000Z"));

    const rows = [
      {
        id: "past",
        startAt: new Date("2026-05-01T20:00:00.000Z"),
        endAt: new Date("2026-05-01T23:00:00.000Z"),
        recurrenceRule: null,
      },
      {
        id: "soon",
        startAt: new Date("2026-06-20T20:00:00.000Z"),
        endAt: new Date("2026-06-20T23:00:00.000Z"),
        recurrenceRule: null,
      },
      {
        id: "later",
        startAt: new Date("2026-07-01T20:00:00.000Z"),
        endAt: new Date("2026-07-01T23:00:00.000Z"),
        recurrenceRule: null,
      },
    ];

    const sorted = sortEventsForAdmin(rows, new Map());

    expect(sorted.map((entry) => entry.row.id)).toEqual(["soon", "later", "past"]);
    expect(sorted[0]?.isUpcoming).toBe(true);
    expect(sorted.at(-1)?.isUpcoming).toBe(false);
  });
});

describe("getEventDisplayDate", () => {
  it("returns the next occurrence for recurring events when available", () => {
    const nextOccurrence = new Date("2026-07-01T20:00:00.000Z");
    const startAt = new Date("2026-01-01T20:00:00.000Z");

    expect(
      getEventDisplayDate(
        { id: "recurring", startAt, recurrenceRule: "FREQ=WEEKLY" },
        new Map([["recurring", nextOccurrence]]),
      ),
    ).toEqual(nextOccurrence);
  });

  it("falls back to startAt when no next occurrence exists", () => {
    const startAt = new Date("2026-01-01T20:00:00.000Z");

    expect(
      getEventDisplayDate(
        { id: "recurring", startAt, recurrenceRule: "FREQ=WEEKLY" },
        new Map(),
      ),
    ).toEqual(startAt);
  });
});
