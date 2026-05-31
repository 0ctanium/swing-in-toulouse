import "server-only";

import { cookies, headers } from "next/headers";

import {
  POSTHOG_DISTINCT_ID_COOKIE,
  POSTHOG_DISTINCT_ID_HEADER,
} from "@/lib/posthog/distinct-id-cookie";

/** Lecture seule — le cookie est créé dans le middleware. */
export async function getPostHogDistinctId(): Promise<string> {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(POSTHOG_DISTINCT_ID_COOKIE)?.value;

  if (fromCookie) {
    return fromCookie;
  }

  const headerStore = await headers();
  const fromHeader = headerStore.get(POSTHOG_DISTINCT_ID_HEADER);

  if (fromHeader) {
    return fromHeader;
  }

  return crypto.randomUUID();
}
