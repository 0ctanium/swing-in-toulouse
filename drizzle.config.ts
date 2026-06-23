import "@/load-env";

import { defineConfig } from "drizzle-kit";

import { env } from "./src/env";
import { neonConfig } from "@neondatabase/serverless";

if (env.NEON_LOCAL) {
  neonConfig.fetchEndpoint = "http://localhost:5432/sql";
  neonConfig.useSecureWebSocket = false;
  neonConfig.poolQueryViaFetch = true;
}

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: env.DATABASE_URL,
    ssl: env.NEON_LOCAL ? false : undefined,
  },
});
