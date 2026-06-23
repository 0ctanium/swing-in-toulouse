import { NextResponse } from "next/server";

import { auth } from "@clerk/nextjs/server";
import { checkRole } from "./roles";

export async function isAuthenticated() {
  const authState = await auth();
  return authState.userId !== null;
}

/** Clerk admin permission. */
export async function isAdminAuthenticated() {
  return await checkRole("admin");
}

export async function requireAdmin() {
  const authenticated = await isAdminAuthenticated();

  if (!authenticated) {
    throw new Error("UNAUTHORIZED");
  }
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
}

export async function assertAdminApi() {
  if (await isAdminAuthenticated()) {
    return null;
  }

  return unauthorizedResponse();
}
