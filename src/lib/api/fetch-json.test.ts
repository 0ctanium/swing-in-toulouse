import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError, fetchJson, fetchJsonVoid } from "@/lib/api/fetch-json";

describe("fetchJson", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns parsed JSON for successful responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({ ok: true }, { status: 200 }),
      ),
    );

    await expect(fetchJson<{ ok: boolean }>("/api/test")).resolves.toEqual({
      ok: true,
    });
  });

  it("throws ApiError with the server error message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({ error: "Accès refusé." }, { status: 403 }),
      ),
    );

    await expect(fetchJson("/api/test")).rejects.toMatchObject({
      name: "ApiError",
      message: "Accès refusé.",
    });
  });
});

describe("fetchJsonVoid", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("resolves for successful empty responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 204 })),
    );

    await expect(fetchJsonVoid("/api/test", { method: "DELETE" })).resolves.toBeUndefined();
  });

  it("uses the fallback error for non-JSON error bodies", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("nope", { status: 500 })),
    );

    await expect(fetchJsonVoid("/api/test")).rejects.toBeInstanceOf(ApiError);
  });
});
