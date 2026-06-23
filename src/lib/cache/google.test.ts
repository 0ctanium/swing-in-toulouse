import { describe, expect, it } from "vitest";

import {
  GOOGLE_MAPS_HTTP_CACHE_CONTROL,
  googlePlaceCacheKey,
  googleStaticMapCacheKey,
} from "@/lib/cache/google";

describe("google cache helpers", () => {
  it("builds stable place cache keys", () => {
    expect(googlePlaceCacheKey("places/ChIJ123")).toBe("ChIJ123");
    expect(googlePlaceCacheKey("ChIJ123")).toBe("ChIJ123");
  });

  it("builds stable static map cache keys", () => {
    expect(googleStaticMapCacheKey(43.6046, 1.4442, 14)).toBe(
      "43.6046,1.4442,z14",
    );
  });

  it("exposes immutable HTTP cache headers", () => {
    expect(GOOGLE_MAPS_HTTP_CACHE_CONTROL).toContain("public");
    expect(GOOGLE_MAPS_HTTP_CACHE_CONTROL).toContain("immutable");
  });
});
