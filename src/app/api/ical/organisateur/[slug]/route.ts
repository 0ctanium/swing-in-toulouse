import { icalFeedRedirect } from "@/lib/ical/redirect";
import { emptyIcalPayload } from "@/lib/ical/payload";

export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { slug } = await context.params;

  return icalFeedRedirect(request, {
    ...emptyIcalPayload(),
    org: [slug],
  });
}
