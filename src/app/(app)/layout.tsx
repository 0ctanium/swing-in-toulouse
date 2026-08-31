import { Suspense } from "react";

import { AdminModeBanner } from "@/components/admin/admin-mode-banner";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { JsonLd } from "@/components/seo/json-ld";
import { siteWebSiteJsonLd } from "@/lib/seo/structured-data";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <JsonLd data={siteWebSiteJsonLd()} />
      <SiteHeader />
      <main
        className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-10"
        suppressHydrationWarning
      >
        {children}
      </main>
      <SiteFooter />
      <Suspense>
        <AdminModeBanner />
      </Suspense>
    </>
  );
}
