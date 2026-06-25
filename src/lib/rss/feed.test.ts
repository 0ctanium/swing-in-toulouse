import { describe, expect, it } from "vitest";

import type { EventOccurrence } from "@/lib/ical/recurrence";
import {
  buildAtomEntryId,
  escapeXml,
  serializeAtomFeed,
} from "@/lib/rss/feed";

function createOccurrence(
  overrides: Partial<EventOccurrence> = {},
): EventOccurrence {
  return {
    id: "event-1#2026-06-27T19:00:00.000Z",
    masterEventId: "event-1",
    slug: "soiree-lindy",
    title: "Soirée Lindy",
    description: "Débutants bienvenus & friends",
    startAt: new Date("2026-06-27T17:00:00.000Z"),
    endAt: new Date("2026-06-27T20:00:00.000Z"),
    isAllDay: false,
    locationRaw: null,
    sourceUrl: null,
    url: "https://example.com/source",
    icalData: null,
    status: "published",
    categories: ["Lindy Hop"],
    organization: {
      name: "Swing Club",
    } as EventOccurrence["organization"],
    source: {
      name: "Fixture",
    } as EventOccurrence["source"],
    venue: {
      name: "Le Taquin",
    } as EventOccurrence["venue"],
    ...overrides,
  };
}

describe("escapeXml", () => {
  it("escapes reserved characters", () => {
    expect(escapeXml(`Tom & Jerry "friends"`)).toBe(
      "Tom &amp; Jerry &quot;friends&quot;",
    );
  });
});

describe("serializeAtomFeed", () => {
  it("produces a valid Atom document with escaped content", () => {
    const feed = serializeAtomFeed(
      [createOccurrence()],
      new Date("2026-06-25T12:00:00.000Z"),
    );

    expect(feed).toContain('<?xml version="1.0" encoding="utf-8"?>');
    expect(feed).toContain('<feed xmlns="http://www.w3.org/2005/Atom" xml:lang="fr">');
    expect(feed).toContain("<title>Soirée Lindy</title>");
    expect(feed).toContain(
      buildAtomEntryId(createOccurrence()),
    );
    expect(feed).toContain("Débutants bienvenus &amp; friends");
    expect(feed).toContain("http://localhost:3000/feed.xml");
    expect(feed).toContain("http://localhost:3000/evenement/soiree-lindy");
  });
});

describe("buildAtomEntryId", () => {
  it("uses a stable per-occurrence URI", () => {
    expect(buildAtomEntryId(createOccurrence())).toBe(
      "http://localhost:3000/evenement/soiree-lindy#event-1%232026-06-27T19%3A00%3A00.000Z",
    );
  });
});
