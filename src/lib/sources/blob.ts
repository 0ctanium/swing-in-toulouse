import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

import { env, isBlobStorageConfigured } from "@/env";

export const MAX_ICAL_FILE_SIZE_BYTES = 10 * 1024 * 1024;

/**
 * Uploaded iCal files live in a private S3 bucket (Scaleway Object Storage in production).
 * `sources.ical_blob_url` holds the object key; rows still carrying a Vercel Blob URL from before
 * the move are rewritten by `scripts/migrate-blobs-to-s3.ts`.
 */
export function icalBlobPath(sourceId: string) {
  return `sources/${sourceId}.ics`;
}

let client: S3Client | undefined;

function s3() {
  if (!isBlobStorageConfigured()) {
    throw new Error("Le stockage des fichiers iCal n'est pas configuré (S3_*).");
  }
  client ??= new S3Client({
    region: env.S3_REGION,
    endpoint: env.S3_ENDPOINT,
    forcePathStyle: true,
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY_ID!,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY!,
    },
  });
  return client;
}

function isLegacyBlobUrl(ref: string) {
  return ref.startsWith("https://");
}

export async function uploadIcalBlob(sourceId: string, content: Buffer) {
  const key = icalBlobPath(sourceId);
  await s3().send(
    new PutObjectCommand({
      Bucket: env.S3_BUCKET,
      Key: key,
      Body: content,
      ContentType: "text/calendar",
    }),
  );
  return { url: key };
}

export async function readIcalBlob(ref: string) {
  if (isLegacyBlobUrl(ref)) {
    throw new Error(
      "Fichier iCal encore sur Vercel Blob : lancer scripts/migrate-blobs-to-s3.ts.",
    );
  }

  const result = await s3().send(
    new GetObjectCommand({ Bucket: env.S3_BUCKET, Key: ref }),
  );

  if (!result.Body) {
    throw new Error("Impossible de lire le fichier iCal stocké.");
  }

  return result.Body.transformToString("utf8");
}

export async function deleteIcalBlob(ref: string | null | undefined) {
  if (!ref || isLegacyBlobUrl(ref)) {
    return;
  }

  await s3().send(new DeleteObjectCommand({ Bucket: env.S3_BUCKET, Key: ref }));
}
