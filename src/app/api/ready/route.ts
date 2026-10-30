import { sql } from "drizzle-orm";
import { connection } from "next/server";
import { NextResponse } from "next/server";

import { db } from "@/db";

/** Readiness: the database answers within 2 s. 503 otherwise, so the pod receives no traffic. */
export async function GET() {
  await connection();

  try {
    await Promise.race([
      db.execute(sql`select 1`),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), 2000),
      ),
    ]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("not ready", error);
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
