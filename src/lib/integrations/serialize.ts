import type { Integration } from "@/db/schema";
import type { VercelDnsRecord } from "@/lib/organizations/custom-domain";

export type IntegrationDomainPayload = {
  customDomain: string | null;
  customDomainStatus: Integration["customDomainStatus"];
  customDomainAddedAt: string | null;
  customDomainVerifiedAt: string | null;
  dnsRecords: VercelDnsRecord[];
};

export function serializeIntegrationDomain(
  integration: Pick<
    Integration,
    | "customDomain"
    | "customDomainStatus"
    | "customDomainAddedAt"
    | "customDomainVerifiedAt"
  >,
  dnsRecords: VercelDnsRecord[] = [],
): IntegrationDomainPayload {
  return {
    customDomain: integration.customDomain,
    customDomainStatus: integration.customDomainStatus,
    customDomainAddedAt:
      integration.customDomainAddedAt?.toISOString() ?? null,
    customDomainVerifiedAt:
      integration.customDomainVerifiedAt?.toISOString() ?? null,
    dnsRecords,
  };
}

export type IntegrationListItem = {
  id: string;
  organizationId: string;
  name: string;
  type: Integration["type"];
  isActive: boolean;
  customDomain: string | null;
  customDomainStatus: Integration["customDomainStatus"];
  theme: Integration["theme"];
  baseFilters: Integration["baseFilters"];
  createdAt: string;
  updatedAt: string;
};

export function serializeIntegration(
  integration: Integration,
): IntegrationListItem {
  return {
    id: integration.id,
    organizationId: integration.organizationId,
    name: integration.name,
    type: integration.type,
    isActive: integration.isActive,
    customDomain: integration.customDomain,
    customDomainStatus: integration.customDomainStatus,
    theme: integration.theme,
    baseFilters: integration.baseFilters,
    createdAt: integration.createdAt.toISOString(),
    updatedAt: integration.updatedAt.toISOString(),
  };
}
