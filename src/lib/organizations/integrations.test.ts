import { describe, expect, it } from "vitest";

import {
  canCreateIntegration,
  hasIntegrationsEntitlement,
  isIntegrationAccessible,
} from "@/lib/organizations/integrations";

describe("integrations entitlement", () => {
  it("requires an active organization and a positive quota", () => {
    expect(
      hasIntegrationsEntitlement({
        isActive: true,
        integrationsQuota: 1,
      }),
    ).toBe(true);
    expect(
      hasIntegrationsEntitlement({
        isActive: false,
        integrationsQuota: 1,
      }),
    ).toBe(false);
    expect(
      hasIntegrationsEntitlement({
        isActive: true,
        integrationsQuota: 0,
      }),
    ).toBe(false);
  });

  it("enforces create quota", () => {
    expect(
      canCreateIntegration({ isActive: true, integrationsQuota: 2 }, 1),
    ).toBe(true);
    expect(
      canCreateIntegration({ isActive: true, integrationsQuota: 1 }, 1),
    ).toBe(false);
  });

  it("checks integration accessibility", () => {
    expect(
      isIntegrationAccessible(
        { isActive: true },
        { isActive: true, integrationsQuota: 1 },
      ),
    ).toBe(true);
    expect(
      isIntegrationAccessible(
        { isActive: false },
        { isActive: true, integrationsQuota: 1 },
      ),
    ).toBe(false);
  });
});
