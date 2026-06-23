import type { Metadata } from "next";
import { Suspense } from "react";

import { CategoryTagsAdmin } from "@/components/admin/category-tags-admin";
import { Skeleton } from "@/components/ui/skeleton";
import { listAdminCategoryTags } from "@/lib/event-category-tags/admin";
import { parseAdminCategoryTagsSearchParams } from "@/lib/event-category-tags/params";
import { adminMetadata } from "@/lib/metadata";
import { assertPlatformAdmin } from "@/lib/admin/roles";

export const metadata: Metadata = adminMetadata({
  title: "Réglages",
  description:
    "Métadonnées des tags de catégories — regroupement pour les filtres et sélecteurs.",
});

type AdminSettingsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function AdminSettingsPageSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-96 w-full rounded-xl" />
    </div>
  );
}

async function AdminSettingsPageContent({
  searchParams,
}: AdminSettingsPageProps) {
  await assertPlatformAdmin();

  const resolvedSearchParams = await searchParams;
  const query = parseAdminCategoryTagsSearchParams(resolvedSearchParams);
  const tags = await listAdminCategoryTags(query);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-semibold">Réglages</h1>
        <p className="text-muted-foreground max-w-2xl">
          Les tags proviennent des catégories iCal des événements et des
          sources. Vous ne modifiez pas le nom du tag ici, seulement son type
          pour regrouper les listes de catégories (agenda, admin, etc.). Pour
          les tags Danse, configurez aussi la page publique /danse/[slug].
        </p>
      </div>

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="font-heading text-xl font-semibold">
            Tags de catégories
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Types : Danse, Événement, Autre (par défaut si non configuré).
          </p>
        </div>

        <CategoryTagsAdmin data={tags} />
      </section>
    </div>
  );
}

export default function AdminSettingsPage({
  searchParams,
}: AdminSettingsPageProps) {
  return (
    <Suspense fallback={<AdminSettingsPageSkeleton />}>
      <AdminSettingsPageContent searchParams={searchParams} />
    </Suspense>
  );
}
