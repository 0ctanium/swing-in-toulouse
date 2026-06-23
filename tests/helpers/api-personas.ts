import { expect } from "vitest";

import { FIXTURE_CLERK_ORGS } from "./seed";
import {
  setClerkAuth,
  setAnonymousClerkAuth,
} from "../setup/integration-mocks";

export const apiPersonas = {
  anonymous: () => setAnonymousClerkAuth(),
  orgMemberA: () =>
    setClerkAuth({
      userId: "user_org_a",
      orgId: FIXTURE_CLERK_ORGS.orgA,
    }),
  orgMemberB: () =>
    setClerkAuth({
      userId: "user_org_b",
      orgId: FIXTURE_CLERK_ORGS.orgB,
    }),
  platformAdmin: () =>
    setClerkAuth({
      userId: "user_platform_admin",
      role: "admin",
    }),
  adminInOrgA: () =>
    setClerkAuth({
      userId: "user_platform_admin",
      orgId: FIXTURE_CLERK_ORGS.orgA,
      role: "admin",
    }),
} as const;

export type ApiPersona = keyof typeof apiPersonas;

export function applyApiPersona(persona: ApiPersona) {
  apiPersonas[persona]();
}

export function expectUnauthorized(status: number) {
  expect(status).toBe(401);
}

export function expectAuthorized(status: number) {
  expect(status).not.toBe(401);
}
