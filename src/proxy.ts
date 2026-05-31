import { type NextRequest, NextResponse } from "next/server";

import {
  POSTHOG_DISTINCT_ID_COOKIE,
  POSTHOG_DISTINCT_ID_HEADER,
  postHogDistinctIdCookieOptions,
} from "@/lib/posthog/distinct-id-cookie";

export function proxy(request: NextRequest) {
  const existing = request.cookies.get(POSTHOG_DISTINCT_ID_COOKIE)?.value;

  if (existing) {
    return NextResponse.next();
  }

  const distinctId = crypto.randomUUID();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(POSTHOG_DISTINCT_ID_HEADER, distinctId);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  response.cookies.set(
    POSTHOG_DISTINCT_ID_COOKIE,
    distinctId,
    postHogDistinctIdCookieOptions,
  );

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
