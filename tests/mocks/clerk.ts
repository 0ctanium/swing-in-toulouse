import type { AuthObject } from "@clerk/backend";
import { vi } from "vitest";

export type MockClerkAuthOptions = {
  userId?: string | null;
  orgId?: string | null;
  role?: "admin";
};

export function buildClerkAuthState({
  userId = null,
  orgId = null,
  role,
}: MockClerkAuthOptions = {}): AuthObject {
  return {
    userId,
    sessionId: userId ? "sess_test" : null,
    orgId,
    orgRole: orgId ? "org:member" : null,
    orgSlug: orgId ? "test-org" : null,
    sessionClaims: role ? { metadata: { role } } : null,
    getToken: vi.fn().mockResolvedValue("test-token"),
    has: vi.fn().mockReturnValue(false),
    debug: vi.fn(),
    actor: null,
    sessionStatus: userId ? "active" : null,
    isAuthenticated: Boolean(userId),
    redirectToSignIn: vi.fn(),
    redirectToSignUp: vi.fn(),
    protect: vi.fn(),
  } as unknown as AuthObject;
}

/** @deprecated Use setClerkAuth() from integration-mocks in integration tests. */
export function mockClerkAuth(options: MockClerkAuthOptions = {}) {
  return buildClerkAuthState(options);
}
