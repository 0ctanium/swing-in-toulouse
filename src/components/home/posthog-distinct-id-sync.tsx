"use client";

import posthog from "posthog-js";
import { useEffect } from "react";

type PostHogDistinctIdSyncProps = {
  distinctId: string;
};

/** Aligne le client PostHog avec le distinct_id du cookie serveur. */
export function PostHogDistinctIdSync({ distinctId }: PostHogDistinctIdSyncProps) {
  useEffect(() => {
    if (posthog.get_distinct_id() !== distinctId) {
      posthog.identify(distinctId);
    }
  }, [distinctId]);

  return null;
}
