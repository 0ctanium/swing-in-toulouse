import type { Integration, Organization } from "@/db/schema";

export function hasIntegrationsEntitlement(
  organization: Pick<Organization, "integrationsQuota" | "isActive">,
) {
  return organization.isActive && organization.integrationsQuota > 0;
}

export function canCreateIntegration(
  organization: Pick<Organization, "integrationsQuota" | "isActive">,
  currentCount: number,
) {
  return (
    hasIntegrationsEntitlement(organization) &&
    currentCount < organization.integrationsQuota
  );
}

export function isIntegrationAccessible(
  integration: Pick<Integration, "isActive">,
  organization: Pick<Organization, "integrationsQuota" | "isActive">,
) {
  return (
    integration.isActive &&
    organization.isActive &&
    organization.integrationsQuota > 0
  );
}

/** @deprecated Use hasIntegrationsEntitlement */
export function hasCustomIntegrations(
  organization: Pick<Organization, "integrationsQuota" | "isActive">,
) {
  return hasIntegrationsEntitlement(organization);
}
