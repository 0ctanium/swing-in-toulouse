import { connection } from "next/server";
import { NextResponse } from "next/server";

/** Liveness: the process answers. No dependency is checked. */
export async function GET() {
  await connection();
  return NextResponse.json({ ok: true });
}
