import { describe, expect, it } from "vitest";

import {
  absoluteUrl,
  danceTagUrl,
  dancesIndexUrl,
  eventIcalUrl,
  eventUrl,
  organizerIcalUrl,
  organizerUrl,
  venueUrl,
} from "@/lib/site";

describe("site URL helpers", () => {
  it("builds absolute URLs from site config", () => {
    expect(absoluteUrl("/agenda")).toBe("http://localhost:3000/agenda");
  });

  it("builds entity URLs", () => {
    expect(eventUrl("soiree-lindy")).toBe(
      "http://localhost:3000/evenement/soiree-lindy",
    );
    expect(organizerUrl("swing-club")).toBe(
      "http://localhost:3000/organisateur/swing-club",
    );
    expect(venueUrl("le-grand-bal")).toBe(
      "http://localhost:3000/lieu/le-grand-bal",
    );
    expect(dancesIndexUrl()).toBe("http://localhost:3000/danse");
    expect(danceTagUrl("lindy-hop")).toBe(
      "http://localhost:3000/danse/lindy-hop",
    );
  });

  it("builds filtered iCal URLs", () => {
    expect(organizerIcalUrl("swing-club")).toContain("/api/ical/");
    expect(organizerIcalUrl("swing-club")).toMatch(/\.ics$/);
    expect(eventIcalUrl("soiree-lindy")).toContain("/api/ical/");
    expect(eventIcalUrl("soiree-lindy")).toMatch(/\.ics$/);
  });
});
