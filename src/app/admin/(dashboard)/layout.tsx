import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AdminLogoutButton } from "@/components/admin/admin-logout-button";
import { AdminSubNav } from "@/components/admin/admin-sub-nav";
import { EventsPendingAlert } from "@/components/admin/events-pending-alert";
import { isAdminConfigured } from "@/env";
import { isAdminAuthenticated } from "@/lib/admin/auth";
import { getEventConfirmQueueStats } from "@/lib/events/confirm-queue";

function AdminDashboardShell({ children }: { children?: React.ReactNode }) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 -mt-4">
      {children}
    </div>
  );
}

async function AdminDashboardLayoutInner({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isAdminConfigured()) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 py-10">
        <h1 className="font-heading text-2xl font-semibold">Administration</h1>
        <p className="text-muted-foreground">
          Définissez <code>ADMIN_SECRET</code> dans votre fichier{" "}
          <code>.env.local</code> pour activer l&apos;interface admin.
        </p>
      </div>
    );
  }

  const authenticated = await isAdminAuthenticated();

  if (!authenticated) {
    redirect("/admin/login");
  }

  const { pendingCount } = await getEventConfirmQueueStats();

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 -mt-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/admin"
          className="font-heading text-xl font-semibold tracking-tight hover:underline"
        >
          Administration
        </Link>
        <AdminLogoutButton />
      </div>
      <AdminSubNav />
      <EventsPendingAlert pendingCount={pendingCount} />
      {children}
    </div>
  );
}

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<AdminDashboardShell />}>
      <AdminDashboardLayoutInner>{children}</AdminDashboardLayoutInner>
    </Suspense>
  );
}
