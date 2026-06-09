import type { Metadata } from "next";
import { Suspense } from "react";

import {
  DancePageContent,
  DancePageSkeleton,
} from "@/components/dances/dance-page-content";
import {
  dancePageDescription,
  dancePageTitle,
  getPublishedDanceTagBySlug,
} from "@/lib/event-category-tags/dance-pages";
import { publicMetadata } from "@/lib/metadata";

type DancePageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: DancePageProps): Promise<Metadata> {
  const { slug } = await params;
  const tag = await getPublishedDanceTagBySlug(slug);

  if (!tag) {
    return { title: "Danse introuvable" };
  }

  return publicMetadata({
    title: dancePageTitle(tag),
    description: dancePageDescription(tag),
    path: `/danse/${tag.slug}`,
  });
}

export default function DancePage(props: DancePageProps) {
  return (
    <Suspense fallback={<DancePageSkeleton />}>
      <DancePageContent {...props} />
    </Suspense>
  );
}
