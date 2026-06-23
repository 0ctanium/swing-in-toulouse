import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const getAdminAccessScope = vi.hoisted(() => vi.fn());

vi.mock("@/lib/admin/access", () => ({
  getAdminAccessScope,
}));

import { getEventsQueryEditKey } from "@/lib/admin/events-query-edit-key";

describe("getEventsQueryEditKey", () => {
  beforeEach(() => {
    getAdminAccessScope.mockReset();
  });

  it('returns "none" for anonymous users', async () => {
    getAdminAccessScope.mockResolvedValue(null);

    await expect(getEventsQueryEditKey()).resolves.toBe("none");
  });

  it('returns "none" for users without a writable scope', async () => {
    getAdminAccessScope.mockResolvedValue({
      userId: "user-1",
      clerkOrganizationId: "org_unmapped",
      organizationId: null,
      hasAdminRole: false,
      isPlatformAdmin: false,
    });

    await expect(getEventsQueryEditKey()).resolves.toBe("none");
  });

  it('returns "all" for platform admins in personal space', async () => {
    getAdminAccessScope.mockResolvedValue({
      userId: "admin-1",
      clerkOrganizationId: null,
      organizationId: null,
      hasAdminRole: true,
      isPlatformAdmin: true,
    });

    await expect(getEventsQueryEditKey()).resolves.toBe("all");
  });

  it("returns an org-scoped key for organization members", async () => {
    getAdminAccessScope.mockResolvedValue({
      userId: "user-1",
      clerkOrganizationId: "org_clerk_a",
      organizationId: "11111111-1111-4111-8111-111111111111",
      hasAdminRole: false,
      isPlatformAdmin: false,
    });

    await expect(getEventsQueryEditKey()).resolves.toBe("org:org_clerk_a");
  });
});
