import { describe, expect, it } from "vitest";

import {
  buildCalendarSubscribeOptions,
  getDefaultFeedName,
  getGoogleCalendarSubscribeUrl,
  toWebcalUrl,
} from "@/lib/ical/subscribe";
import { emptyIcalPayload } from "@/lib/ical/payload";

describe("toWebcalUrl", () => {
  it("rewrites https URLs to webcal", () => {
    expect(toWebcalUrl("https://example.com/feed.ics")).toBe(
      "webcal://example.com/feed.ics",
    );
  });
});

describe("getGoogleCalendarSubscribeUrl", () => {
  it("wraps the feed in a Google Calendar cid parameter", () => {
    const url = getGoogleCalendarSubscribeUrl("https://example.com/feed.ics");

    expect(url).toContain("calendar.google.com");
    expect(url).toContain(encodeURIComponent("webcal://example.com/feed.ics"));
  });
});

describe("getDefaultFeedName", () => {
  it("uses the explicit feed name when provided", () => {
    expect(getDefaultFeedName(emptyIcalPayload(), "Mon agenda")).toBe(
      "Mon agenda",
    );
  });

  it("uses a single event slug as the feed name", () => {
    expect(
      getDefaultFeedName({ ...emptyIcalPayload(), event: ["soiree-lindy"] }),
    ).toBe("soiree-lindy");
  });

  it("falls back to the site name for unfiltered feeds", () => {
    expect(getDefaultFeedName(emptyIcalPayload())).toBe("Swingin Toulouse");
  });
});

describe("buildCalendarSubscribeOptions", () => {
  it("returns subscribe links for major calendar apps", () => {
    const options = buildCalendarSubscribeOptions(emptyIcalPayload());

    expect(options.map((option) => option.id)).toEqual([
      "google",
      "apple",
      "outlook",
      "office365",
      "download",
    ]);
    expect(options[0]?.href).toContain("calendar.google.com");
    expect(options[1]?.href).toMatch(/^webcal:\/\//);
  });
});
