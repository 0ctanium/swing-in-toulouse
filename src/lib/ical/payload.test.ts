import { describe, expect, it } from "vitest";

import {
  GLOBAL_ICAL_PAYLOAD,
  IcalPayloadError,
  buildIcalFeedPath,
  decodeIcalPayload,
  describeIcalPayload,
  emptyIcalPayload,
  encodeIcalPayload,
  hasActiveIcalPayload,
} from "@/lib/ical/payload";

describe("encodeIcalPayload / decodeIcalPayload", () => {
  it("round-trips active filters with stable key ordering", () => {
    const filters = {
      category: ["blues", "lindy"],
      venue: ["le-grand-bal"],
      org: ["swing-club"],
      event: [],
    };

    const encoded = encodeIcalPayload(filters);
    expect(decodeIcalPayload(encoded)).toEqual(filters);
  });

  it("returns the global payload for empty filters", () => {
    expect(encodeIcalPayload(emptyIcalPayload())).toBe(GLOBAL_ICAL_PAYLOAD);
    expect(decodeIcalPayload(GLOBAL_ICAL_PAYLOAD)).toEqual(emptyIcalPayload());
  });

  it("rejects invalid encodings", () => {
    expect(() => decodeIcalPayload("%%%")).toThrow(IcalPayloadError);
    expect(() => decodeIcalPayload(Buffer.from("{").toString("base64url"))).toThrow(
      IcalPayloadError,
    );
  });
});

describe("hasActiveIcalPayload", () => {
  it("detects agenda and event filters", () => {
    expect(hasActiveIcalPayload(emptyIcalPayload())).toBe(false);
    expect(
      hasActiveIcalPayload({ ...emptyIcalPayload(), category: ["lindy"] }),
    ).toBe(true);
    expect(
      hasActiveIcalPayload({ ...emptyIcalPayload(), event: ["event-slug"] }),
    ).toBe(true);
  });
});

describe("buildIcalFeedPath", () => {
  it("builds a feed path with encoded payload", () => {
    expect(buildIcalFeedPath(emptyIcalPayload())).toBe(
      `/api/ical/${GLOBAL_ICAL_PAYLOAD}.ics`,
    );
  });
});

describe("describeIcalPayload", () => {
  it("reports whether filters are active", () => {
    expect(describeIcalPayload(emptyIcalPayload())).toEqual({
      isFiltered: false,
    });
    expect(
      describeIcalPayload({ ...emptyIcalPayload(), org: ["swing-club"] }),
    ).toEqual({ isFiltered: true });
  });
});
