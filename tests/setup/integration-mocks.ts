import { vi } from "vitest";

import { buildClerkAuthState } from "../mocks/clerk";
import type { MockClerkAuthOptions } from "../mocks/clerk";

const clerkAuthMock = vi.hoisted(() => vi.fn());

vi.mock("server-only", () => ({}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: () => clerkAuthMock(),
  currentUser: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
  unstable_cache: (fn: () => unknown) => fn,
  cache: (fn: () => unknown) => fn,
  cacheTag: vi.fn(),
  cacheLife: vi.fn(),
}));

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();

  return {
    ...actual,
    cache: <T extends (...args: unknown[]) => unknown>(fn: T) => fn,
  };
});

vi.mock("@/lib/posthog-server", () => ({
  getPostHogClient: () => ({
    capture: vi.fn(),
    shutdown: vi.fn(),
  }),
}));

vi.mock("@upstash/qstash/nextjs", () => ({
  verifySignatureAppRouter: (handler: (request: Request) => Promise<Response>) =>
    handler,
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  })),
  headers: vi.fn(async () => new Headers()),
}));

export function setClerkAuth(options: MockClerkAuthOptions = {}) {
  clerkAuthMock.mockResolvedValue(buildClerkAuthState(options));
}

export function setAnonymousClerkAuth() {
  setClerkAuth({ userId: null });
}
