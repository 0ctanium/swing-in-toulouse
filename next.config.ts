import type { NextConfig } from "next";
import { withPostHogConfig } from "@posthog/nextjs-config";
import createMDX from "@next/mdx";

import "./src/env";
import { adminRobotsHeader } from "./src/lib/seo/admin-robots";

const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: ["remark-gfm"],
  },
});

const nextConfig: NextConfig = {
  cacheComponents: true,
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  serverExternalPackages: ["node-ical", "pg"],
  async redirects() {
    return [
      {
        source: "/agenda.ics",
        destination: "/api/ical/e30=.ics",
        statusCode: 307,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/admin/:path*",
        headers: [
          {
            key: "X-Robots-Tag",
            value: adminRobotsHeader,
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/api/ical/organisateur/:slug.ics",
        destination: "/api/ical/organisateur/:slug",
      },
      {
        source: "/organisateur/:slug.ics",
        destination: "/api/ical/organisateur/:slug",
      },
      {
        source: "/evenement/:slug.ics",
        destination: "/api/ical/evenement/:slug",
      },
      {
        source: "/swingest/static/:path*",
        destination: "https://eu-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/swingest/array/:path*",
        destination: "https://eu-assets.i.posthog.com/array/:path*",
      },
      {
        source: "/swingest/:path*",
        destination: "https://eu.i.posthog.com/:path*",
      },
    ];
  },
  skipTrailingSlashRedirect: true,
};

export default withPostHogConfig(withMDX(nextConfig), {
  personalApiKey: process.env.POSTHOG_API_KEY!,
  envId: "190420",
  host: "https://eu.i.posthog.com",
  sourcemaps: {
    enabled: true,
    project: "swing-in-toulouse",
    deleteAfterUpload: true,
  },
});
