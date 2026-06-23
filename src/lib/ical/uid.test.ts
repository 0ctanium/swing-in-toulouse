import { describe, expect, it, vi } from "vitest";

vi.mock("node:crypto", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:crypto")>();

  return {
    ...actual,
    randomUUID: vi.fn(() => "11111111-2222-4333-8444-555555555555"),
  };
});

import {
  normalizeImportedUid,
  resolveEventUid,
} from "@/lib/ical/uid";

describe("normalizeImportedUid", () => {
  it("trims whitespace", () => {
    expect(normalizeImportedUid("  uid@example.com  ")).toBe("uid@example.com");
  });
});

describe("resolveEventUid", () => {
  it("reuses a trimmed source uid when provided", () => {
    expect(resolveEventUid(" imported@feed.test ")).toBe("imported@feed.test");
  });

  it("generates a site-scoped uid when source uid is missing", () => {
    expect(resolveEventUid(null)).toBe(
      "11111111-2222-4333-8444-555555555555@swing-toulouse.fr",
    );
  });
});
