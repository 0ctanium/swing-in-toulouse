import { describe, expect, it } from "vitest";

import { normalizeCustomDomain } from "@/lib/organizations/custom-domain-validation";

describe("normalizeCustomDomain", () => {
  it("lowercases and strips www prefix", () => {
    expect(normalizeCustomDomain(" WWW.AGENDA.TRAC.FR ")).toBe(
      "agenda.trac.fr",
    );
  });

  it("rejects protocols and paths", () => {
    expect(() => normalizeCustomDomain("https://agenda.trac.fr")).toThrow(
      /sans protocole/i,
    );
    expect(() => normalizeCustomDomain("agenda.trac.fr/path")).toThrow(
      /sans protocole/i,
    );
  });

  it("rejects the primary site domain and vercel.app domains", () => {
    expect(() =>
      normalizeCustomDomain("swing-toulouse.fr", {
        primaryHost: "swing-toulouse.fr",
      }),
    ).toThrow(/site principal/i);
    expect(() => normalizeCustomDomain("demo.vercel.app")).toThrow(
      /vercel\.app/i,
    );
  });

  it("rejects malformed domains", () => {
    expect(() => normalizeCustomDomain("not a domain")).toThrow(/invalide/i);
  });
});
