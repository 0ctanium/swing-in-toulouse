import type { Metadata } from "next";
import { Suspense } from "react";

import { HomePageEventsSection } from "@/components/events/home-page-events-section";
import { HomeHero } from "@/components/home/home-hero";
import { HomePageHeroSection } from "@/components/home/home-page-hero-section";
import { Skeleton } from "@/components/ui/skeleton";
import { publicMetadata } from "@/lib/metadata";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = publicMetadata({
  title: { absolute: siteConfig.name },
  description: siteConfig.description,
  path: "/",
});

function HomePageEventsSkeleton() {
  return (
    <>
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-28 w-full rounded-xl" />
      <Skeleton className="h-48 w-full rounded-xl" />
    </>
  );
}

function HomeHeroFallback() {
  return <HomeHero variant="a" art="vinyl" showPicker={false} />;
}

type HomePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default function HomePage({ searchParams }: HomePageProps) {
  return (
    <div className="flex flex-col gap-12 md:gap-16">
      <Suspense fallback={<HomeHeroFallback />}>
        <HomePageHeroSection searchParams={searchParams} />
      </Suspense>

      <Suspense fallback={<HomePageEventsSkeleton />}>
        <HomePageEventsSection />
      </Suspense>
    </div>
  );
}
