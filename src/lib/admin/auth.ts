import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { env, isAdminConfigured } from "@/env";

export const ADMIN_COOKIE_NAME = "admin_session";

export function createAdminSessionToken(secret: string) {
  return createHash("sha256").update(`admin:${secret}`).digest("hex");
}

export async function isAdminAuthenticated() {
  if (!isAdminConfigured()) {
    return false;
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;

  if (!token) {
    return false;
  }

  const expected = createAdminSessionToken(env.ADMIN_SECRET!);
  const left = Buffer.from(token);
  const right = Buffer.from(expected);

  if (left.length !== right.length) {
    return false;
  }

  return timingSafeEqual(left, right);
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

export function adminDisabledResponse() {
  return NextResponse.json(
    { error: "Interface admin non configurée (ADMIN_SECRET manquant)." },
    { status: 503 },
  );
}

export async function assertAdminApi(request?: NextRequest) {
  if (!isAdminConfigured()) {
    return adminDisabledResponse();
  }

  if (request) {
    const bearer = request.headers.get("authorization");
    if (bearer === `Bearer ${env.ADMIN_SECRET}`) {
      return null;
    }
  }

  const authenticated = await isAdminAuthenticated();

  if (!authenticated) {
    return unauthorizedResponse();
  }

  return null;
}
