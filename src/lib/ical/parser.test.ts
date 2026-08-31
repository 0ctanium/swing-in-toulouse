import { readFileSync } from "node:fs";
import { join } from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchAndParseIcalFeed, parseIcalContent } from "@/lib/ical/parser";

const fixturePath = join(
  process.cwd(),
  "tests/fixtures/ics/minimal-feed.ics",
);

describe("parseIcalContent", () => {
  it("parses events from an iCal fixture", async () => {
    const content = readFileSync(fixturePath, "utf8");
    const events = await parseIcalContent(content);

    expect(events).toHaveLength(2);
    expect(events[0]?.title).toBe("Bal Lindy Fixture");
    expect(events[0]?.location).toContain("Le Petit Bal");
  });
});

describe("fetchAndParseIcalFeed", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends validators and skips parse on 304", async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 304 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchAndParseIcalFeed("https://example.test/feed.ics", {
      etag: '"abc"',
      lastModified: "Wed, 01 Jan 2026 00:00:00 GMT",
    });

    expect(result).toEqual({ status: "not-modified" });
    expect(fetchMock).toHaveBeenCalledOnce();
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const headers = new Headers(init.headers);
    expect(headers.get("If-None-Match")).toBe('"abc"');
    expect(headers.get("If-Modified-Since")).toBe(
      "Wed, 01 Jan 2026 00:00:00 GMT",
    );
  });

  it("parses a 200 feed and returns validators", async () => {
    const content = readFileSync(fixturePath, "utf8");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(content, {
          status: 200,
          headers: {
            etag: '"v2"',
            "last-modified": "Thu, 02 Jan 2026 00:00:00 GMT",
          },
        }),
      ),
    );

    const result = await fetchAndParseIcalFeed("https://example.test/feed.ics");

    expect(result.status).toBe("ok");
    if (result.status !== "ok") {
      return;
    }

    expect(result.events).toHaveLength(2);
    expect(result.etag).toBe('"v2"');
    expect(result.lastModified).toBe("Thu, 02 Jan 2026 00:00:00 GMT");
  });
});
