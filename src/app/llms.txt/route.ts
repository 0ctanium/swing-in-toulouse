import { buildLlmsTxt } from "@/lib/seo/llms-txt";

export async function GET() {
  const body = await buildLlmsTxt();

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
