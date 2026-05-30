import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";

import { AdminModeBanner } from "@/components/admin/admin-mode-banner";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Providers } from "@/components/providers";
import { isAdminAuthenticated } from "@/lib/admin/auth";
import { siteConfig } from "@/lib/site";

import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-heading",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  metadataBase: new URL(siteConfig.url),
  appleWebApp: {
    capable: true,
    title: "Swing In Toulouse",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isAdminMode = await isAdminAuthenticated();

  return (
    <html
      lang="fr"
      className={`${dmSans.variable} ${fraunces.variable} h-full`}
    >
      <body className="flex min-h-full flex-col antialiased">
        <AdminModeBanner />
        <SiteHeader isAdminMode={isAdminMode} />
        <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-10">
          <Providers isAdminMode={isAdminMode}>{children}</Providers>
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
