import { redirect } from "next/navigation";
import { Suspense } from "react";

import { isAuthenticated } from "@/lib/admin/auth";
import { Skeleton } from "@/components/ui/skeleton";

function IntegrationEditorLayoutSkeleton() {
  return (
    <div className="bg-background fixed inset-0 z-10 flex flex-col">
      <Skeleton className="h-14 w-full shrink-0 rounded-none" />
      <div className="flex min-h-0 flex-1">
        <Skeleton className="h-full w-56 shrink-0 rounded-none" />
        <Skeleton className="h-full flex-1 rounded-none" />
      </div>
    </div>
  );
}

async function IntegrationEditorLayoutInner({
  children,
}: {
  children: React.ReactNode;
}) {
  const authenticated = await isAuthenticated();

  if (!authenticated) {
    redirect("/admin/login?redirect_url=/admin/integration");
  }

  return children;
}

export default function IntegrationEditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-background fixed inset-0 z-10 flex flex-col">
      <Suspense fallback={<IntegrationEditorLayoutSkeleton />}>
        <IntegrationEditorLayoutInner>{children}</IntegrationEditorLayoutInner>
      </Suspense>
    </div>
  );
}
