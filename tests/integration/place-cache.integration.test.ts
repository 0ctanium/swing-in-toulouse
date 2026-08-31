import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  googlePlaceDetailsCacheKey,
  googlePlaceDisplayCacheKey,
} from "@/lib/cache/google";
import { invalidateGooglePlaceCache } from "@/lib/cache/invalidate";
import { readCache } from "@/lib/cache/store";
import { fetchPlaceDisplayDataUncached } from "@/lib/google/place-display";
import { getPlaceDetails } from "@/lib/google/places";

import { resetIntegrationDb } from "../helpers/setup-integration-db";

const placeId = "ChIJ123";

function jsonResponse(body: unknown, ok = true) {
  return {
    ok,
    status: ok ? 200 : 502,
    text: async () => JSON.stringify(body),
    json: async () => body,
  };
}

describe("Google place postgres cache", () => {
  beforeEach(async () => {
    await resetIntegrationDb();
    vi.spyOn(await import("@/env"), "isGoogleMapsConfigured").mockReturnValue(
      true,
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("fetches place details once and reuses the postgres row", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse({
        id: placeId,
        displayName: { text: "Salle des fêtes" },
        formattedAddress: "1 rue, 31000 Toulouse, France",
        location: { latitude: 43.6, longitude: 1.44 },
        addressComponents: [
          { longText: "1", types: ["street_number"] },
          { longText: "rue", types: ["route"] },
          { longText: "Toulouse", types: ["locality"] },
        ],
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const first = await getPlaceDetails(placeId);
    const second = await getPlaceDetails(placeId);

    expect(first.name).toBe("Salle des fêtes");
    expect(second).toEqual(first);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    await expect(
      readCache(googlePlaceDetailsCacheKey(placeId)),
    ).resolves.toEqual(first);
  });

  it("fetches place display data once and skips caching failed lookups", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({}, false))
      .mockResolvedValueOnce(
        jsonResponse({
          googleMapsUri: "https://maps.google.com/?cid=1",
          websiteUri: "https://example.com",
          rating: 4.5,
          userRatingCount: 12,
          regularOpeningHours: { weekdayDescriptions: ["lundi: 10:00"] },
          photos: [],
        }),
      );
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchPlaceDisplayDataUncached(placeId)).resolves.toBeNull();
    await expect(
      readCache(googlePlaceDisplayCacheKey(placeId)),
    ).resolves.toBeUndefined();

    const display = await fetchPlaceDisplayDataUncached(placeId);
    expect(display?.websiteUri).toBe("https://example.com");
    expect(fetchMock).toHaveBeenCalledTimes(2);

    await fetchPlaceDisplayDataUncached(placeId);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("drops postgres place rows when the Next cache is invalidated", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse({
          id: placeId,
          displayName: { text: "Salle" },
          formattedAddress: "Toulouse",
          location: { latitude: 43.6, longitude: 1.44 },
          addressComponents: [{ longText: "Toulouse", types: ["locality"] }],
        }),
      ),
    );

    await getPlaceDetails(placeId);
    await invalidateGooglePlaceCache(placeId);

    await expect(
      readCache(googlePlaceDetailsCacheKey(placeId)),
    ).resolves.toBeUndefined();
  });
});
