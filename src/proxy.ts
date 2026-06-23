import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isLegacySignInRoute = createRouteMatcher(["/sign-in(.*)"]);

export default clerkMiddleware(async (_auth, req) => {
  if (isLegacySignInRoute(req)) {
    const url = new URL("/admin/login", req.url);
    url.search = req.nextUrl.search;
    return NextResponse.redirect(url);
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
