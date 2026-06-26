import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import { NextResponse } from "next/server";

import { env, isQStashConfigured } from "@/env";
import {
  pruneProjectedOccurrencesOutsideWindow,
  rebuildAllOccurrences,
} from "@/lib/events/occurrence-projector";
import { getProjectionWindow } from "@/lib/events/projection-window";
import { invalidateAllPublicCache } from "@/lib/cache/invalidate";

export const maxDuration = 300;

async function runProjectionMaintenance() {
  const window = getProjectionWindow();
  const projected = await rebuildAllOccurrences(window);
  await pruneProjectedOccurrencesOutsideWindow(window);
  invalidateAllPublicCache();

  return NextResponse.json({
    projectedAt: new Date().toISOString(),
    projected,
    window: {
      from: window.from.toISOString(),
      to: window.to.toISOString(),
    },
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
    async () => runProjectionMaintenance(),
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
