import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { getOrganizationByClerkOrganizationId } from "@/lib/organizations/clerk-sync";
import {
  type AdminDataScope,
  resolveAdminDataScope,
} from "@/lib/admin/data-scope";

export type AdminAccessScope = {
  userId: string;
  clerkOrganizationId: string | null;
  organizationId: string | null;
  hasAdminRole: boolean;
  isPlatformAdmin: boolean;
};

export async function getAdminAccessScope(): Promise<AdminAccessScope | null> {
  const authState = await auth();
  const { userId, orgId, sessionClaims } = authState;

  if (!userId) {
    return null;
  }

  const hasAdminRole = sessionClaims?.metadata?.role === "admin";
  let organizationId: string | null = null;

  if (orgId) {
    const organization = await getOrganizationByClerkOrganizationId(orgId);
    organizationId = organization?.id ?? null;
  }

  return {
    userId,
    clerkOrganizationId: orgId ?? null,
    organizationId,
    hasAdminRole,
    isPlatformAdmin: hasAdminRole && !orgId,
  };
}

export async function assertPlatformAdminPage() {
  const scope = await getAdminAccessScope();

  if (!scope?.userId) {
    redirect("/admin/login?redirect_url=/admin");
  }

  if (!scope.isPlatformAdmin) {
    redirect("/admin");
  }

  return scope;
}

export async function requireAdminDataScope(): Promise<AdminDataScope> {
  const scope = await getAdminAccessScope();

  if (!scope?.userId) {
    redirect("/admin/login?redirect_url=/admin");
  }

  const dataScope = resolveAdminDataScope(scope);

  if (dataScope.mode === "none") {
    redirect("/admin");
  }

  return dataScope;
}

export async function getAdminDataScopeOrNull(): Promise<AdminDataScope | null> {
  const scope = await getAdminAccessScope();

  if (!scope?.userId) {
    return null;
  }

  const dataScope = resolveAdminDataScope(scope);

  if (dataScope.mode === "none") {
    return null;
  }

  return dataScope;
}
