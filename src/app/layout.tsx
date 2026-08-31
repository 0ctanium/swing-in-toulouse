import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";

import { SpeedInsights } from "@vercel/speed-insights/next";
import { AppClerkProvider } from "@/components/clerk-provider";
import { Providers } from "@/components/providers";
import { ThemeProvider } from "@/components/theme-provider";
import { siteConfig } from "@/lib/site";

import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  metadataBase: new URL(siteConfig.url),
  alternates: {
    types: {
      "application/atom+xml": [
        {
          url: "/feed.xml",
          title: "Événements à venir",
        },
      ],
    },
  },
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
    statusBarStyle: "default",
  },
  icons: {
    apple: "/web-app-manifest-192x192.png",
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
        <AppClerkProvider>
          <ThemeProvider>
            <Providers>{children}</Providers>
          </ThemeProvider>
        </AppClerkProvider>
      </body>
    </html>
  );
}
