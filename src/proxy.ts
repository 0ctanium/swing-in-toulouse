import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

import {
  getIntegrationByVerifiedDomain,
  isPrimaryOrLocalHost,
  normalizeRequestHost,
} from "@/lib/organizations/domain-lookup";

const isLegacySignInRoute = createRouteMatcher(["/sign-in(.*)"]);

export default clerkMiddleware(async (_auth, req) => {
  if (isLegacySignInRoute(req)) {
    const url = new URL("/admin/login", req.url);
    url.search = req.nextUrl.search;
    return NextResponse.redirect(url);
  }

  const host = normalizeRequestHost(req.headers.get("host"));

  if (host && !isPrimaryOrLocalHost(host)) {
    const match = await getIntegrationByVerifiedDomain(host);

    if (match) {
      const url = req.nextUrl.clone();
      url.pathname = `/embed/${match.integrationId}`;
      url.search = "";
      return NextResponse.rewrite(url);
    }
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
