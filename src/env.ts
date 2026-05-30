import "./load-env";

import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    DATABASE_URL: z.string().url(),
    CRON_SYNC_URL: z.string().url().optional(),
    QSTASH_URL: z.string().url().optional(),
    QSTASH_TOKEN: z.string().optional(),
    QSTASH_CURRENT_SIGNING_KEY: z.string().optional(),
    QSTASH_NEXT_SIGNING_KEY: z.string().optional(),
    ADMIN_SECRET: z.string().min(16).optional(),
  },
  client: {
    NEXT_PUBLIC_SITE_URL: z.string().url(),
  },
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    CRON_SYNC_URL: process.env.CRON_SYNC_URL,
    QSTASH_URL: process.env.QSTASH_URL,
    QSTASH_TOKEN: process.env.QSTASH_TOKEN,
    QSTASH_CURRENT_SIGNING_KEY: process.env.QSTASH_CURRENT_SIGNING_KEY,
    QSTASH_NEXT_SIGNING_KEY: process.env.QSTASH_NEXT_SIGNING_KEY,
    ADMIN_SECRET: process.env.ADMIN_SECRET,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
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

export function isAdminConfigured() {
  return Boolean(env.ADMIN_SECRET);
}
