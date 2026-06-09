import type { Metadata } from "next";
import Link from "next/link";

import { DancesIndex } from "@/components/dances/dances-index";
import { Breadcrumbs } from "@/components/seo/breadcrumbs";
import { breadcrumbJsonLd, JsonLd } from "@/components/seo/json-ld";
import { listPublishedDanceTags } from "@/lib/event-category-tags/dance-pages";
import { publicMetadata } from "@/lib/metadata";
import { danceIndexBreadcrumbs } from "@/lib/seo/structured-data";

export const metadata: Metadata = publicMetadata({
  title: "Danses swing",
  description:
    "Découvrez les styles de danse swing à Toulouse : Lindy Hop, Blues, Balboa, West Coast Swing et plus et leurs prochains événements.",
  path: "/danse",
});

export default async function DancesIndexPage() {
  const dances = await listPublishedDanceTags();
  const breadcrumbs = danceIndexBreadcrumbs();

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(breadcrumbs)} />
      <div className="flex flex-col gap-8">
        <Breadcrumbs items={breadcrumbs} />

        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">
            Les danses swing à Toulouse
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Chaque style a sa scène locale : soirées, cours, pratiques et
            stages. Consultez les pages ci-dessous pour les prochains événements
            par danse, ou parcourez l&apos;{" "}
            <Link href="/agenda" className="text-foreground underline">
              agenda complet
            </Link>
            .
          </p>
        </div>

        <DancesIndex dances={dances} />
      </div>
    </>
  );
}
