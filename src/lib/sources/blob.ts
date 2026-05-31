import { del, get, put } from "@vercel/blob";

import { env, isBlobStorageConfigured } from "@/env";

export const MAX_ICAL_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export function assertBlobStorageConfigured() {
  if (!isBlobStorageConfigured()) {
    throw new Error(
      "Stockage blob non configuré (BLOB_READ_WRITE_TOKEN manquant).",
    );
  }
}

export function icalBlobPath(sourceId: string) {
  return `sources/${sourceId}.ics`;
}

export async function uploadIcalBlob(sourceId: string, content: Buffer) {
  assertBlobStorageConfigured();

  return put(icalBlobPath(sourceId), content, {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    token: env.BLOB_READ_WRITE_TOKEN,
    contentType: "text/calendar",
  });
}

export async function readIcalBlob(blobUrl: string) {
  assertBlobStorageConfigured();

  const result = await get(blobUrl, {
    access: "private",
    token: env.BLOB_READ_WRITE_TOKEN,
  });

  if (!result || result.statusCode !== 200 || !result.stream) {
    throw new Error("Impossible de lire le fichier iCal stocké.");
  }

  return new Response(result.stream).text();
}

export async function deleteIcalBlob(blobUrl: string | null | undefined) {
  if (!blobUrl) {
    return;
  }

  assertBlobStorageConfigured();

  await del(blobUrl, { token: env.BLOB_READ_WRITE_TOKEN });
}
