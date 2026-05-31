import { icalFeedRedirect } from "@/lib/ical/redirect";
import { emptyIcalPayload } from "@/lib/ical/payload";
import { getPostHogClient } from "@/lib/posthog-server";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { slug } = await context.params;

  const posthog = getPostHogClient();
  posthog.capture({
    distinctId: "anonymous",
    event: "organizer_calendar_subscribed",
    properties: { organizer_slug: slug },
  });

  return icalFeedRedirect(request, {
    ...emptyIcalPayload(),
    org: [slug],
  });
}
