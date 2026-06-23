import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AdminSubNav } from "@/components/admin/admin-sub-nav";
import { EventsPendingAlert } from "@/components/admin/events-pending-alert";
import { isAuthenticated } from "@/lib/admin/auth";
import { getEventConfirmQueueStats } from "@/lib/events/confirm-queue";
import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import { Protect } from "@/components/admin-protect";

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
  const authenticated = await isAuthenticated();

  if (!authenticated) {
    redirect("/admin/login?redirect_url=/admin");
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
        <div className="flex items-center gap-2">
          <Protect fallback={<OrganizationSwitcher hidePersonal />}>
            <OrganizationSwitcher />
          </Protect>
          <UserButton />
        </div>
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
