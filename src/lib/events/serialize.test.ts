import { describe, expect, it } from "vitest";

import {
  parseOccurrence,
  parseOccurrences,
  serializeOccurrence,
} from "@/lib/events/serialize";
import type { EventOccurrence } from "@/lib/events/queries";

const occurrence = {
  masterEventId: "33333333-3333-4333-8333-333333333333",
  title: "Soirée Lindy",
  startAt: new Date("2026-03-15T20:00:00.000Z"),
  endAt: new Date("2026-03-15T23:00:00.000Z"),
} as EventOccurrence;

describe("serializeOccurrence", () => {
  it("serializes dates to ISO strings", () => {
    expect(serializeOccurrence(occurrence)).toEqual({
      ...occurrence,
      startAt: "2026-03-15T20:00:00.000Z",
      endAt: "2026-03-15T23:00:00.000Z",
    });
  });
});

describe("parseOccurrence", () => {
  it("parses ISO strings back into dates", () => {
    const serialized = serializeOccurrence(occurrence);
    const parsed = parseOccurrence(serialized);

    expect(parsed.startAt).toEqual(occurrence.startAt);
    expect(parsed.endAt).toEqual(occurrence.endAt);
  });
});

describe("parseOccurrences", () => {
  it("parses a list of serialized occurrences", () => {
    const serialized = serializeOccurrence(occurrence);
    expect(parseOccurrences([serialized])).toHaveLength(1);
  });
});
