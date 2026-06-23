import { describe, expect, it } from "vitest";

import { buildStaticMapProxyUrl } from "@/lib/google/static-map";

describe("buildStaticMapProxyUrl", () => {
  it("builds the internal maps proxy URL", () => {
    expect(buildStaticMapProxyUrl(43.6046, 1.4442)).toBe(
      "/api/maps/static?lat=43.6046&lng=1.4442",
    );
  });
});
