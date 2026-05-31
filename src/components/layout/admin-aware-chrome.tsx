import { Suspense } from "react";

import { AdminModeProvider } from "@/components/admin/admin-mode-provider";
import { isAdminAuthenticated } from "@/lib/admin/auth";

async function AdminAwareChromeInner({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAdminMode = await isAdminAuthenticated();

  return (
    <AdminModeProvider isAdminMode={isAdminMode}>{children}</AdminModeProvider>
  );
}

function AdminAwareChromeFallback({ children }: { children: React.ReactNode }) {
  return <AdminModeProvider isAdminMode={false}>{children}</AdminModeProvider>;
}

export function AdminAwareChrome({ children }: { children: React.ReactNode }) {
  const content = <Suspense>{children}</Suspense>;

  return (
    <Suspense
      fallback={<AdminAwareChromeFallback>{content}</AdminAwareChromeFallback>}
    >
      <AdminAwareChromeInner>{content}</AdminAwareChromeInner>
    </Suspense>
  );
}
