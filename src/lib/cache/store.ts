import { and, eq, gt, inArray } from "drizzle-orm";

import { db } from "@/db";
import { cacheEntries } from "@/db/schema";

export type RememberCacheOptions<T> = {
  persist?: (value: T) => boolean;
};

export async function readCache<T>(key: string): Promise<T | undefined> {
  const row = await db.query.cacheEntries.findFirst({
    where: and(eq(cacheEntries.key, key), gt(cacheEntries.ttl, new Date())),
  });

  if (!row) {
    return undefined;
  }

  return row.value as T;
}

export async function writeCache<T>(
  key: string,
  value: T,
  ttlMs: number,
): Promise<void> {
  const ttl = new Date(Date.now() + ttlMs);

  await db
    .insert(cacheEntries)
    .values({ key, value, ttl })
    .onConflictDoUpdate({
      target: cacheEntries.key,
      set: { value, ttl },
    });
}

export async function deleteCache(key: string): Promise<void> {
  await db.delete(cacheEntries).where(eq(cacheEntries.key, key));
}

export async function deleteCacheKeys(keys: string[]): Promise<void> {
  if (keys.length === 0) {
    return;
  }

  await db.delete(cacheEntries).where(inArray(cacheEntries.key, keys));
}

export async function rememberCache<T>(
  key: string,
  ttlMs: number,
  load: () => Promise<T>,
  options?: RememberCacheOptions<T>,
): Promise<T> {
  const cached = await readCache<T>(key);
  if (cached !== undefined) {
    return cached;
  }

  const value = await load();
  const persist = options?.persist ?? ((next: T) => next !== undefined);
  if (persist(value)) {
    await writeCache(key, value, ttlMs);
  }

  return value;
}
