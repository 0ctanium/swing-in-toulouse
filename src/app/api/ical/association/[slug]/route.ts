import { NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;
  return NextResponse.redirect(
    new URL(`/api/ical/organisateur/${slug}`, _request.url),
    308,
  );
}
