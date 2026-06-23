import type { AdminAccessScope } from "@/lib/admin/access";

const baseScope = {
  userId: "user_test",
  hasAdminRole: false,
  isPlatformAdmin: false,
} satisfies Partial<AdminAccessScope>;

export function buildAccessScope(
  overrides: Partial<AdminAccessScope> = {},
): AdminAccessScope {
  const scope = { ...baseScope, ...overrides };

  return {
    userId: scope.userId,
    clerkOrganizationId: scope.clerkOrganizationId ?? null,
    organizationId: scope.organizationId ?? null,
    hasAdminRole: scope.hasAdminRole,
    isPlatformAdmin:
      scope.isPlatformAdmin ??
      (scope.hasAdminRole && !scope.clerkOrganizationId),
  };
}

/** Org member with a mapped DB organization. */
export function orgMemberScope(organizationId = "org_db_1") {
  return buildAccessScope({
    clerkOrganizationId: "org_clerk_1",
    organizationId,
  });
}

/** Platform admin in personal space (no active Clerk org). */
export function platformAdminScope() {
  return buildAccessScope({
    hasAdminRole: true,
    isPlatformAdmin: true,
  });
}

/** Admin who switched into an org context — not platform-wide. */
export function adminInOrgScope(organizationId = "org_db_1") {
  return buildAccessScope({
    clerkOrganizationId: "org_clerk_1",
    organizationId,
    hasAdminRole: true,
    isPlatformAdmin: false,
  });
}

/** Signed in but no org and no admin role. */
export function signedInNoAccessScope() {
  return buildAccessScope();
}

/** Clerk org active but not mapped to a DB organization. */
export function unmappedOrgScope() {
  return buildAccessScope({
    clerkOrganizationId: "org_clerk_unknown",
    organizationId: null,
  });
}
