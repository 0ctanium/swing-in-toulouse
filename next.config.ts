import type { NextConfig } from "next";

import "./src/env";

const nextConfig: NextConfig = {
  serverExternalPackages: ["node-ical", "pg"],
  async redirects() {
    return [
      {
        source: "/agenda.ics",
        destination: "/api/ical/e30.ics",
        statusCode: 307,
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/organisateur/:slug.ics",
        destination: "/api/ical/organisateur/:slug",
      },
      {
        source: "/evenement/:slug.ics",
        destination: "/api/ical/evenement/:slug",
      },
    ];
  },
};

export default nextConfig;
