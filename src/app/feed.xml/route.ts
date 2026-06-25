import { buildEventAtomFeed } from "@/lib/rss/feed";

export async function GET() {
  const body = await buildEventAtomFeed();

  return new Response(body, {
    headers: {
      "Content-Type": "application/atom+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
    },
  });
}
