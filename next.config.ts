import path from "node:path";

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
  // Self-contained server for the container image (Dockerfile). The tracing root is pinned so
  // that `.next/standalone/server.js` lands at the same place whatever the parent directories
  // contain (Next otherwise walks up looking for a workspace lockfile).
  output: "standalone",
  outputFileTracingRoot: path.join(import.meta.dirname),
  // node-ical requires temporal-polyfill; on Node 22.12+ `require()` takes its `module-sync`
  // export (ESM), which the tracing, resolving the `require` condition, does not copy.
  outputFileTracingIncludes: {
    "/**/*": ["./node_modules/.pnpm/temporal-polyfill@*/node_modules/temporal-polyfill/**/*"],
  },
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

let config = withMDX(nextConfig);

if (process.env.SKIP_POSTHOG !== "true") {
  config = withPostHogConfig(config, {
    personalApiKey: process.env.POSTHOG_API_KEY!,
    projectId: "190420",
    host: "https://eu.i.posthog.com",
    logLevel: "error",
    sourcemaps: {
      enabled: true,
      project: "swing-in-toulouse",
      deleteAfterUpload: true,
    },
  });
}

export default config;
