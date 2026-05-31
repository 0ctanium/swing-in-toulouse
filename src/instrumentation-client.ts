import posthog from "posthog-js";

import { POSTHOG_DISTINCT_ID_COOKIE } from "@/lib/posthog/distinct-id-cookie";

function readDistinctIdFromCookie(): string | undefined {
  if (typeof document === "undefined") {
    return undefined;
  }

  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${POSTHOG_DISTINCT_ID_COOKIE}=([^;]*)`),
  );

  return match?.[1] ? decodeURIComponent(match[1]) : undefined;
}

const bootstrapDistinctId = readDistinctIdFromCookie();

posthog.init(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN!, {
  api_host: `${process.env.NEXT_PUBLIC_SITE_URL}/swingest`,
  ui_host: "https://eu.posthog.com",
  defaults: "2026-01-30",
  capture_exceptions: true,
  debug: false,
  ...(bootstrapDistinctId
    ? { bootstrap: { distinctID: bootstrapDistinctId } }
    : {}),
});
