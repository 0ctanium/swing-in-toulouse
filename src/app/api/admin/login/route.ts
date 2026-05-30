import { NextRequest, NextResponse } from "next/server";

import { env, isAdminConfigured } from "@/env";
import {
  ADMIN_COOKIE_NAME,
  createAdminSessionToken,
} from "@/lib/admin/auth";

export async function POST(request: NextRequest) {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      { error: "ADMIN_SECRET non configuré." },
      { status: 503 },
    );
  }

  const body = (await request.json()) as { secret?: string };

  if (!body.secret) {
    return NextResponse.json({ error: "Secret requis." }, { status: 400 });
  }

  if (body.secret !== env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Secret invalide." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE_NAME, createAdminSessionToken(body.secret), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(ADMIN_COOKIE_NAME);
  return response;
}
