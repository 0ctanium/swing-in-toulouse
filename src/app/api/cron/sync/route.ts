import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import { NextResponse } from "next/server";

import { env, isQStashConfigured } from "@/env";
import { syncAllSources } from "@/lib/ical/sync";
import { asyncGeneratorToArray } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

async function runSync() {
  const results = await asyncGeneratorToArray(syncAllSources());

  return NextResponse.json({
    syncedAt: new Date().toISOString(),
    sources: results.length,
    results: results.map((result) => ({
      slug: result.source.slug,
      name: result.source.name,
      organizer: result.source.organization?.name ?? null,
      stats: result.stats ?? null,
      error: result.error ?? null,
    })),
  });
}

export async function POST(request: Request) {
  if (!isQStashConfigured()) {
    return NextResponse.json(
      { error: "QStash is not configured" },
      { status: 503 },
    );
  }

  const verifiedHandler = verifySignatureAppRouter(
    async () => runSync(),
    {
      currentSigningKey: env.QSTASH_CURRENT_SIGNING_KEY!,
      nextSigningKey: env.QSTASH_NEXT_SIGNING_KEY!,
    },
  );

  return verifiedHandler(request);
}

export async function GET(request: Request) {
  return POST(request);
}
