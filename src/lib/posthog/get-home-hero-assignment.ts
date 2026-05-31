import type { JsonType } from "posthog-js";

import { getPostHogClient } from "@/lib/posthog-server";
import {
  assignmentFromFlagVariantKey,
  HOME_HERO_FLAG,
  parseHomeHeroFlagPayload,
  type HomeHeroExperimentAssignment,
} from "@/lib/posthog/home-hero";

export type HomeHeroAssignment = HomeHeroExperimentAssignment & {
  flagVariant: string | null;
  distinctId: string;
};

export async function getHomeHeroAssignment(
  distinctId: string,
): Promise<HomeHeroAssignment> {
  const posthog = getPostHogClient();

  const flag = await posthog.evaluateFlags(distinctId, {
    flagKeys: [HOME_HERO_FLAG],
  });
  const flagVariant = flag.getFlag(HOME_HERO_FLAG);
  const payload = flag.getFlagPayload(HOME_HERO_FLAG);

  const flagKey = typeof flagVariant === "string" ? flagVariant : null;
  const fromPayload = parseHomeHeroFlagPayload(payload as JsonType);
  const fromFlagKey = assignmentFromFlagVariantKey(flagKey);

  const layout = fromPayload.layout ?? fromFlagKey.layout;
  const art = fromPayload.layout === "a" ? fromPayload.art : fromFlagKey.art;

  return {
    layout,
    art,
    flagVariant: flagKey,
    distinctId,
  };
}
