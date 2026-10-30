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
    // Connections per process (node-postgres pool). The image build prerenders in several
    // workers at once, each with its own pool: the Dockerfile sets it to 2 there.
    DATABASE_POOL_MAX: z.coerce.number().int().positive().optional(),
    NEON_LOCAL: booleanStringSchema.default(false),
    CRON_SYNC_URL: z.string().url().optional(),
    CRON_PROJECT_OCCURRENCES_URL: z.string().url().optional(),
    QSTASH_URL: z.string().url(),
    QSTASH_TOKEN: z.string(),
    QSTASH_CURRENT_SIGNING_KEY: z.string(),
    QSTASH_NEXT_SIGNING_KEY: z.string(),
    GOOGLE_MAPS_API_KEY: z.string().min(1).optional(),
    // Uploaded iCal files (S3 API; Scaleway Object Storage in production).
    S3_ENDPOINT: z.string().url().optional(),
    S3_REGION: z.string().min(1).default("fr-par"),
    S3_BUCKET: z.string().min(1).optional(),
    S3_ACCESS_KEY_ID: z.string().min(1).optional(),
    S3_SECRET_ACCESS_KEY: z.string().min(1).optional(),
    // Only read by scripts/migrate-blobs-to-s3.ts, to copy files out of Vercel Blob.
    BLOB_READ_WRITE_TOKEN: z.string().min(1).optional(),
    RESEND_API_KEY: z.string().min(1).optional(),
    CONTACT_EMAIL_FROM: z.string().min(1).optional(),
    CONTACT_EMAIL_TO: z.string().email().optional(),
    CONTACT_PHONE: z.string().min(1).optional(),
    CONTACT_NOTIFY_PHONE: z.string().min(1).optional(),
    WHATSAPP_ACCESS_TOKEN: z.string().min(1).optional(),
    WHATSAPP_PHONE_NUMBER_ID: z.string().min(1).optional(),
    WHATSAPP_TEMPLATE_NAME: z.string().min(1).optional(),
    WHATSAPP_TEMPLATE_LANGUAGE: z.string().min(1).optional(),
    CLERK_SECRET_KEY: z.string().min(1),
    PROJECTION_MONTHS_AHEAD: z
      .number()
      .int()
      .positive()
      .default(18)
      .describe(
        "How far ahead occurrences are materialized beyond the default expansion window.",
      ),
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
    CRON_PROJECT_OCCURRENCES_URL: process.env.CRON_PROJECT_OCCURRENCES_URL,
    QSTASH_URL: process.env.QSTASH_URL,
    QSTASH_TOKEN: process.env.QSTASH_TOKEN,
    QSTASH_CURRENT_SIGNING_KEY: process.env.QSTASH_CURRENT_SIGNING_KEY,
    QSTASH_NEXT_SIGNING_KEY: process.env.QSTASH_NEXT_SIGNING_KEY,
    GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY,
    S3_ENDPOINT: process.env.S3_ENDPOINT,
    S3_REGION: process.env.S3_REGION,
    S3_BUCKET: process.env.S3_BUCKET,
    S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID,
    S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY,
    BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    CONTACT_EMAIL_FROM: process.env.CONTACT_EMAIL_FROM,
    CONTACT_EMAIL_TO: process.env.CONTACT_EMAIL_TO,
    CONTACT_PHONE: process.env.CONTACT_PHONE,
    CONTACT_NOTIFY_PHONE: process.env.CONTACT_NOTIFY_PHONE,
    WHATSAPP_ACCESS_TOKEN: process.env.WHATSAPP_ACCESS_TOKEN,
    WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID,
    WHATSAPP_TEMPLATE_NAME: process.env.WHATSAPP_TEMPLATE_NAME,
    WHATSAPP_TEMPLATE_LANGUAGE: process.env.WHATSAPP_TEMPLATE_LANGUAGE,
    DATABASE_LOG: process.env.DATABASE_LOG,
    DATABASE_POOL_MAX: process.env.DATABASE_POOL_MAX,
    PROJECTION_MONTHS_AHEAD: process.env.PROJECTION_MONTHS_AHEAD,
  },
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});

export function getCronSyncUrl() {
  return env.CRON_SYNC_URL ?? `${env.NEXT_PUBLIC_SITE_URL}/api/cron/sync`;
}

export function getCronProjectOccurrencesUrl() {
  return (
    env.CRON_PROJECT_OCCURRENCES_URL ??
    `${env.NEXT_PUBLIC_SITE_URL}/api/cron/project-occurrences`
  );
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

export function isBlobStorageConfigured() {
  return Boolean(
    env.S3_ENDPOINT &&
    env.S3_BUCKET &&
    env.S3_ACCESS_KEY_ID &&
    env.S3_SECRET_ACCESS_KEY,
  );
}
