import { describe, expect, it } from "vitest";

import { serializeCalendar } from "@/lib/ical/serializer";
import type { NormalizedEvent } from "@/lib/ical/types";

const event: NormalizedEvent = {
  uid: "event@test",
  title: "Soirée Lindy",
  description: "Bal swing",
  startAt: new Date("2026-06-20T18:00:00.000Z"),
  endAt: new Date("2026-06-20T21:00:00.000Z"),
  isAllDay: false,
  location: "Le Grand Bal, Toulouse",
  status: "confirmed",
  sequence: 1,
  lastModified: new Date("2026-06-01T12:00:00.000Z"),
  categories: ["lindy"],
  organizer: { name: "Swing Club", email: "club@example.com" },
};

describe("serializeCalendar", () => {
  it("serializes a calendar feed with timezone and events", () => {
    const calendar = serializeCalendar([event], {
      prodId: "-//Test//FR",
      name: "Agenda test",
      description: "Feed de test",
    });

    expect(calendar).toContain("BEGIN:VCALENDAR");
    expect(calendar).toContain("BEGIN:VEVENT");
    expect(calendar).toContain("SUMMARY:Soirée Lindy");
    expect(calendar).toContain("CATEGORIES:lindy");
    expect(calendar).toContain("ORGANIZER;CN=Swing Club:mailto:club@example.com");
    expect(calendar).toContain("BEGIN:VTIMEZONE");
    expect(calendar).toContain("END:VCALENDAR");
  });
});
