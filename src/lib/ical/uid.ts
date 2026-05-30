import { randomUUID } from "node:crypto";

import { siteConfig } from "@/lib/site";

export function generateEventUid() {
  return `${randomUUID()}@${siteConfig.icalDomain}`;
}

export function normalizeImportedUid(uid: string) {
  return uid.trim();
}

export function resolveEventUid(sourceUid?: string | null) {
  if (sourceUid?.trim()) {
    return normalizeImportedUid(sourceUid);
  }

  return generateEventUid();
}
