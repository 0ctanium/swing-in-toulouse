import type { AdminAccessScope } from "@/lib/admin/access";

export type AdminDataScope =
  | { mode: "all" }
  | { mode: "org"; organizationId: string };

export function resolveAdminDataScope(
  scope: AdminAccessScope,
): AdminDataScope | { mode: "none" } {
  if (scope.clerkOrganizationId) {
    if (!scope.organizationId) {
      return { mode: "none" };
    }

    return { mode: "org", organizationId: scope.organizationId };
  }

  if (scope.hasAdminRole) {
    return { mode: "all" };
  }

  return { mode: "none" };
}

export function isOrgScoped(scope: AdminDataScope): scope is {
  mode: "org";
  organizationId: string;
} {
  return scope.mode === "org";
}

export function matchesOrganizationScope(
  scope: AdminDataScope,
  organizationId: string | null | undefined,
) {
  if (scope.mode === "all") {
    return true;
  }

  return organizationId === scope.organizationId;
}

export function resolveWritableOrganizationId(
  scope: AdminDataScope,
  organizationId: string | null | undefined,
) {
  if (scope.mode === "org") {
    return scope.organizationId;
  }

  return organizationId ?? null;
}
