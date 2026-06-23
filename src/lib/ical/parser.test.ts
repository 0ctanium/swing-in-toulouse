import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { parseIcalContent } from "@/lib/ical/parser";

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
