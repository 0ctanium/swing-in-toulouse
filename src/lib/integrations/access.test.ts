import { describe, expect, it } from "vitest";

import { getIntegrationOrgAccessError } from "@/lib/integrations/access";

describe("getIntegrationOrgAccessError", () => {
  it("allows platform admin scope", () => {
    expect(
      getIntegrationOrgAccessError({ mode: "all" }, {
        isActive: true,
        integrationsQuota: 1,
      }),
    ).toBeNull();
  });

  it("forbids orgs without integrations quota", () => {
    expect(
      getIntegrationOrgAccessError(
        { mode: "org", organizationId: "org-1" },
        { isActive: true, integrationsQuota: 0 },
      ),
    ).toEqual({
      status: 403,
      message:
        "Les intégrations personnalisées ne sont pas activées pour cet organisateur.",
    });
  });

  it("allows entitled orgs", () => {
    expect(
      getIntegrationOrgAccessError(
        { mode: "org", organizationId: "org-1" },
        { isActive: true, integrationsQuota: 2 },
      ),
    ).toBeNull();
  });
});
