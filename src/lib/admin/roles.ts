import { redirect } from "next/navigation";

import {
  assertPlatformAdminPage,
  getAdminAccessScope,
} from "@/lib/admin/access";

/** Platform admin in personal space (no active org). */
export async function isPlatformAdmin() {
  const scope = await getAdminAccessScope();
  return scope?.isPlatformAdmin ?? false;
}

/** @deprecated Use isPlatformAdmin() — org context overrides the admin role. */
export const checkRole = async (_role: "admin") => isPlatformAdmin();

export async function assertPlatformAdmin() {
  await assertPlatformAdminPage();
}

/** @deprecated Use assertPlatformAdmin() */
export const assertRole = async (_role: "admin") => {
  const scope = await getAdminAccessScope();

  if (!scope?.userId) {
    redirect("/admin/login");
  }

  if (!scope.isPlatformAdmin) {
    redirect("/admin");
  }
};
