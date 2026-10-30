import {
  drizzle as drizzleNodePostgres,
  type NodePgDatabase,
} from "drizzle-orm/node-postgres";
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
  // Strictly boolean: with SKIP_ENV_VALIDATION (image builds) the raw string "false" would be
  // taken for a Logger object and every query would fail with `logQuery is not a function`.
  logger: env.DATABASE_LOG === true,
} as const satisfies DrizzleConfig<typeof schema>;

// `node-postgres` for a plain Postgres (production on the cluster, docker-compose); `neon-http`
// for Neon. Local Neon (`neon_local`) needs DATABASE_DRIVER=neon-http and NEON_LOCAL=true.
// Typed as the node-postgres database: the two drivers share the query API, and a union type
// would collapse Drizzle's overloads (`.returning({...})` stops compiling).
// node-postgres is the default (as in env.ts), and the only one that tolerates the image build,
// where no DATABASE_URL exists: `pg` connects lazily, at the first query.
export const db: NodePgDatabase<typeof schema> =
  env.DATABASE_DRIVER === "neon-http"
    ? (drizzleNeonHttp(
        env.DATABASE_URL,
        drizzleConfig,
      ) as unknown as NodePgDatabase<typeof schema>)
    : drizzleNodePostgres({
        // Number(): with SKIP_ENV_VALIDATION the value is the raw string.
        connection: {
          connectionString: env.DATABASE_URL,
          max: Number(env.DATABASE_POOL_MAX) || undefined,
        },
        ...drizzleConfig,
      });

export type Db = typeof db;
export type Transaction = Parameters<Parameters<Db["transaction"]>[0]>[0];
