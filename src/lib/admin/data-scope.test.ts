import { describe, expect, it } from "vitest";

import {
  isOrgScoped,
  matchesOrganizationScope,
  resolveAdminDataScope,
  resolveWritableOrganizationId,
} from "@/lib/admin/data-scope";
import {
  adminInOrgScope,
  orgMemberScope,
  platformAdminScope,
  signedInNoAccessScope,
  unmappedOrgScope,
} from "../../../tests/helpers/auth-scopes";

describe("resolveAdminDataScope", () => {
  it("returns org scope when Clerk org maps to a DB organization", () => {
    expect(resolveAdminDataScope(orgMemberScope("org_abc"))).toEqual({
      mode: "org",
      organizationId: "org_abc",
    });
  });

  it("returns none when Clerk org has no DB mapping", () => {
    expect(resolveAdminDataScope(unmappedOrgScope())).toEqual({ mode: "none" });
  });

  it("returns all for platform admin in personal space", () => {
    expect(resolveAdminDataScope(platformAdminScope())).toEqual({ mode: "all" });
  });

  it("returns org scope when platform admin is in org context", () => {
    expect(resolveAdminDataScope(adminInOrgScope("org_abc"))).toEqual({
      mode: "org",
      organizationId: "org_abc",
    });
  });

  it("returns none for signed-in user without org or admin role", () => {
    expect(resolveAdminDataScope(signedInNoAccessScope())).toEqual({
      mode: "none",
    });
  });
});

describe("isOrgScoped", () => {
  it("narrows org-scoped data scopes", () => {
    const scope = resolveAdminDataScope(orgMemberScope());

    expect(isOrgScoped(scope)).toBe(true);

    if (isOrgScoped(scope)) {
      expect(scope.organizationId).toBe("org_db_1");
    }
  });

  it("rejects platform-wide scope", () => {
    expect(isOrgScoped({ mode: "all" })).toBe(false);
  });
});

describe("matchesOrganizationScope", () => {
  it("allows any organization for platform-wide scope", () => {
    expect(matchesOrganizationScope({ mode: "all" }, "org_any")).toBe(true);
    expect(matchesOrganizationScope({ mode: "all" }, null)).toBe(true);
  });

  it("matches only the scoped organization for org members", () => {
    const scope = { mode: "org" as const, organizationId: "org_abc" };

    expect(matchesOrganizationScope(scope, "org_abc")).toBe(true);
    expect(matchesOrganizationScope(scope, "org_other")).toBe(false);
    expect(matchesOrganizationScope(scope, null)).toBe(false);
  });
});

describe("resolveWritableOrganizationId", () => {
  it("forces the org scope organization id for org members", () => {
    const scope = { mode: "org" as const, organizationId: "org_abc" };

    expect(resolveWritableOrganizationId(scope, "org_other")).toBe("org_abc");
    expect(resolveWritableOrganizationId(scope, null)).toBe("org_abc");
  });

  it("passes through the requested organization for platform-wide scope", () => {
    expect(
      resolveWritableOrganizationId({ mode: "all" }, "org_requested"),
    ).toBe("org_requested");
    expect(resolveWritableOrganizationId({ mode: "all" }, null)).toBeNull();
  });
});
