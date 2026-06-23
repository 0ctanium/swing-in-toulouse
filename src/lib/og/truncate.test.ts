import { describe, expect, it } from "vitest";

import { truncate } from "@/lib/og/truncate";

describe("truncate", () => {
  it("returns the original text when it fits", () => {
    expect(truncate("Swing", 10)).toBe("Swing");
  });

  it("truncates long text with an ellipsis", () => {
    expect(truncate("Soirée Lindy Hop à Toulouse", 12)).toBe("Soirée Lind…");
  });
});
