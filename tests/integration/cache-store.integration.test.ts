import { beforeEach, describe, expect, it } from "vitest";

import {
  deleteCache,
  readCache,
  rememberCache,
  writeCache,
} from "@/lib/cache/store";

import { resetIntegrationDb } from "../helpers/setup-integration-db";

describe("cache store", () => {
  beforeEach(async () => {
    await resetIntegrationDb();
  });

  it("writes and reads a JSON value before ttl", async () => {
    await writeCache("demo:key", { hits: 1 }, 60_000);

    await expect(readCache<{ hits: number }>("demo:key")).resolves.toEqual({
      hits: 1,
    });
  });

  it("treats expired rows as a miss", async () => {
    await writeCache("demo:expired", { hits: 1 }, -1_000);

    await expect(readCache("demo:expired")).resolves.toBeUndefined();
  });

  it("overwrites an existing key", async () => {
    await writeCache("demo:key", { hits: 1 }, 60_000);
    await writeCache("demo:key", { hits: 2 }, 60_000);

    await expect(readCache<{ hits: number }>("demo:key")).resolves.toEqual({
      hits: 2,
    });
  });

  it("deletes a key", async () => {
    await writeCache("demo:key", { hits: 1 }, 60_000);
    await deleteCache("demo:key");

    await expect(readCache("demo:key")).resolves.toBeUndefined();
  });

  it("loads once and reuses the stored value", async () => {
    let loads = 0;

    const first = await rememberCache("demo:remember", 60_000, async () => {
      loads += 1;
      return { hits: loads };
    });
    const second = await rememberCache("demo:remember", 60_000, async () => {
      loads += 1;
      return { hits: loads };
    });

    expect(first).toEqual({ hits: 1 });
    expect(second).toEqual({ hits: 1 });
    expect(loads).toBe(1);
  });

  it("skips persist when the loader returns a discarded value", async () => {
    const value = await rememberCache(
      "demo:skip",
      60_000,
      async () => null,
      { persist: (next) => next != null },
    );

    expect(value).toBeNull();
    await expect(readCache("demo:skip")).resolves.toBeUndefined();
  });
});
