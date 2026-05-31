import { Suspense } from "react";

import { AdminModeBanner } from "@/components/admin/admin-mode-banner";
import { AdminModeProvider } from "@/components/admin/admin-mode-provider";
import { SiteHeader } from "@/components/layout/site-header";
import { isAdminAuthenticated } from "@/lib/admin/auth";

async function AdminAwareChromeInner({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAdminMode = await isAdminAuthenticated();

  return (
    <AdminModeProvider isAdminMode={isAdminMode}>
      <AdminModeBanner />
      <SiteHeader isAdminMode={isAdminMode} />
      {children}
    </AdminModeProvider>
  );
}

function AdminAwareChromeFallback() {
  return (
    <AdminModeProvider isAdminMode={false}>
      <SiteHeader isAdminMode={false} />
    </AdminModeProvider>
  );
}

export function AdminAwareChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<AdminAwareChromeFallback />}>
      <AdminAwareChromeInner>{children}</AdminAwareChromeInner>
    </Suspense>
  );
}
