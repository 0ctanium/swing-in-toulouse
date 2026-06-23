import type { Metadata } from "next";
import { Suspense } from "react";

import { AdminDashboardLinks } from "@/components/admin/admin-dashboard-links";
import { AdminDashboardStats } from "@/components/admin/admin-dashboard-stats";
import { AdminOrgSelectionPrompt } from "@/components/admin/admin-org-selection-prompt";
import { Skeleton } from "@/components/ui/skeleton";
import { getAdminDataScopeOrNull } from "@/lib/admin/access";
import { adminMetadata } from "@/lib/metadata";
import { getAdminDashboardStats } from "@/lib/admin/dashboard-stats";
import { Protect } from "@/components/admin-protect";

export const metadata: Metadata = adminMetadata({
  title: "Administration",
  description: "Tableau de bord admin Swingin Toulouse.",
});

function AdminHomePageSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-5 w-full max-w-2xl" />
      </div>
      <Skeleton className="h-72 w-full rounded-xl" />
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  );
}

async function AdminHomePageContent() {
  const dataScope = await getAdminDataScopeOrNull();

  if (!dataScope) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-3xl font-semibold">Administration</h1>
          <p className="text-muted-foreground max-w-2xl">
            Sélectionnez une organisation pour gérer son planning.
          </p>
        </div>
        <AdminOrgSelectionPrompt />
      </div>
    );
  }

  const stats = await getAdminDashboardStats(dataScope);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-semibold">Administration</h1>
        <p className="text-muted-foreground max-w-2xl">
          Accès rapide aux outils externes et vue d&apos;ensemble du site.
        </p>
      </div>
      <AdminDashboardStats stats={stats} />
      <Protect>
        <AdminDashboardLinks />
      </Protect>
    </div>
  );
}

export default function AdminHomePage() {
  return (
    <Suspense fallback={<AdminHomePageSkeleton />}>
      <AdminHomePageContent />
    </Suspense>
  );
}
