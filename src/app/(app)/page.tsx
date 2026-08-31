import type { Metadata } from "next";
import { Suspense } from "react";

import { HomePageEventsSection } from "@/components/events/home-page-events-section";
import { HomeHeroSection } from "@/components/home/home-hero";
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

export default function HomePage() {
  return (
    <div className="flex flex-col gap-12 md:gap-16">
      <HomeHeroSection />

      <Suspense fallback={<HomePageEventsSkeleton />}>
        <HomePageEventsSection />
      </Suspense>
    </div>
  );
}
