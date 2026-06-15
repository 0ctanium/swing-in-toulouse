import { drizzle as drizzleNodePostgres } from "drizzle-orm/node-postgres";
import { drizzle as drizzleNeonHttp } from "drizzle-orm/neon-http";
import { neonConfig } from "@neondatabase/serverless";

import { env } from "@/env";

import * as schema from "./schema";
import { DrizzleConfig } from "drizzle-orm";

if (env.NEON_LOCAL) {
  neonConfig.fetchEndpoint = "http://localhost:5432/sql";
  neonConfig.useSecureWebSocket = false;
  neonConfig.poolQueryViaFetch = true;
}

const drizzleConfig = {
  schema,
  logger: true,
} as const satisfies DrizzleConfig<typeof schema>;

export const db =
  env.DATABASE_DRIVER === "node-postgres"
    ? drizzleNodePostgres(env.DATABASE_URL, drizzleConfig)
    : drizzleNeonHttp(env.DATABASE_URL, drizzleConfig);

export type Db = typeof db;
export type Transaction = Parameters<Parameters<Db["transaction"]>[0]>[0];
