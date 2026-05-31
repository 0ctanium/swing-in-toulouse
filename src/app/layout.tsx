import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";

import { SpeedInsights } from "@vercel/speed-insights/next";
import { AdminAwareChrome } from "@/components/layout/admin-aware-chrome";
import { SiteFooter } from "@/components/layout/site-footer";
import { Providers } from "@/components/providers";
import { ThemeProvider } from "@/components/theme-provider";
import { AdminModeBanner } from "@/components/admin/admin-mode-banner";
import { SiteHeader } from "@/components/layout/site-header";
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
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    siteName: siteConfig.name,
    title: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
  },
  twitter: {
    card: "summary",
    title: siteConfig.name,
    description: siteConfig.description,
  },
  appleWebApp: {
    capable: true,
    title: siteConfig.name,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${dmSans.variable} ${fraunces.variable} h-full`}
      suppressHydrationWarning
    >
      <body
        className="flex min-h-full flex-col antialiased"
        suppressHydrationWarning
      >
        <SpeedInsights />
        <ThemeProvider>
          <Providers>
            <AdminAwareChrome>
              <AdminModeBanner />
              <SiteHeader />
              <main
                className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 py-10"
                suppressHydrationWarning
              >
                {children}
              </main>
            </AdminAwareChrome>
          </Providers>
          <SiteFooter />
        </ThemeProvider>
      </body>
    </html>
  );
}
