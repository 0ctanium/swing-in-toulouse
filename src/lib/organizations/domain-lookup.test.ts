import { describe, expect, it } from "vitest";

import {
  isPrimaryOrLocalHost,
  normalizeRequestHost,
} from "@/lib/organizations/domain-lookup";

describe("normalizeRequestHost", () => {
  it("lowercases hosts and removes ports", () => {
    expect(normalizeRequestHost("Agenda.TRAC.fr:443")).toBe("agenda.trac.fr");
  });

  it("returns null for missing hosts", () => {
    expect(normalizeRequestHost(null)).toBeNull();
  });
});

describe("isPrimaryOrLocalHost", () => {
  it("detects primary and local hosts", () => {
    expect(isPrimaryOrLocalHost("localhost:3000")).toBe(true);
    expect(isPrimaryOrLocalHost("app.localhost")).toBe(true);
    expect(isPrimaryOrLocalHost("agenda.trac.fr")).toBe(false);
  });
});
