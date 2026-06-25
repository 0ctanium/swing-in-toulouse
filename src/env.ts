import "./load-env";

import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

const booleanStringSchema = z.preprocess((value) => {
  if (typeof value == "boolean") return value;
  if (value === "true") {
    return true;
  } else if (value === "false") {
    return false;
  } else {
    throw new Error("The string must be 'true' or 'false'");
  }
}, z.boolean());

export const env = createEnv({
  server: {
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    DATABASE_URL: z.string().url(),
    DATABASE_DRIVER: z
      .enum(["node-postgres", "neon-http"])
      .default("node-postgres"),
    DATABASE_LOG: booleanStringSchema.default(false),
    NEON_LOCAL: booleanStringSchema.default(false),
    CRON_SYNC_URL: z.string().url().optional(),
    QSTASH_URL: z.string().url(),
    QSTASH_TOKEN: z.string(),
    QSTASH_CURRENT_SIGNING_KEY: z.string(),
    QSTASH_NEXT_SIGNING_KEY: z.string(),
    GOOGLE_MAPS_API_KEY: z.string().min(1).optional(),
    BLOB_READ_WRITE_TOKEN: z.string().min(1).optional(),
    CLERK_SECRET_KEY: z.string().min(1),
  },
  client: {
    NEXT_PUBLIC_SITE_URL: z.string().url(),
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  },
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    DATABASE_DRIVER: process.env.DATABASE_DRIVER,
    NEON_LOCAL: process.env.NEON_LOCAL,
    CRON_SYNC_URL: process.env.CRON_SYNC_URL,
    QSTASH_URL: process.env.QSTASH_URL,
    QSTASH_TOKEN: process.env.QSTASH_TOKEN,
    QSTASH_CURRENT_SIGNING_KEY: process.env.QSTASH_CURRENT_SIGNING_KEY,
    QSTASH_NEXT_SIGNING_KEY: process.env.QSTASH_NEXT_SIGNING_KEY,
    GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
    BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    DATABASE_LOG: process.env.DATABASE_LOG,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});

export function getCronSyncUrl() {
  return env.CRON_SYNC_URL ?? `${env.NEXT_PUBLIC_SITE_URL}/api/cron/sync`;
}

export function isQStashConfigured() {
  return Boolean(
    env.QSTASH_TOKEN &&
    env.QSTASH_CURRENT_SIGNING_KEY &&
    env.QSTASH_NEXT_SIGNING_KEY,
  );
}

export function isGoogleMapsConfigured() {
  return Boolean(env.GOOGLE_MAPS_API_KEY);
}
