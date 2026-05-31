import { HomeHeroExposure } from "@/components/home/home-hero-exposure";
import { HomeHero } from "@/components/home/home-hero";
import { PostHogDistinctIdSync } from "@/components/home/posthog-distinct-id-sync";
import { getHomeHeroAssignment } from "@/lib/posthog/get-home-hero-assignment";
import { getPostHogDistinctId } from "@/lib/posthog/get-posthog-distinct-id";
import { parseHomeHeroSearchParams } from "@/lib/posthog/parse-home-hero-search-params";
import { resolveHomeHeroFromSearchParams } from "@/lib/posthog/resolve-home-hero-from-search-params";

type HomePageHeroSectionProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function HomePageHeroSection({
  searchParams,
}: HomePageHeroSectionProps) {
  const params = parseHomeHeroSearchParams(await searchParams);
  const distinctId = await getPostHogDistinctId();

  const assignment =
    resolveHomeHeroFromSearchParams(params, distinctId) ??
    (await getHomeHeroAssignment(distinctId));

  return (
    <>
      <PostHogDistinctIdSync distinctId={distinctId} />
      <HomeHero
        variant={assignment.layout}
        art={assignment.art}
        flagVariant={assignment.flagVariant}
        showPicker={params.showPreview}
      />
      <HomeHeroExposure
        layout={assignment.layout}
        art={assignment.art}
        flagVariant={assignment.flagVariant}
      />
    </>
  );
}
